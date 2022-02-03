import { Stack, StackProps } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as stepFunctions from "aws-cdk-lib/aws-stepfunctions";
import * as stepFunctionsTasks from "aws-cdk-lib/aws-stepfunctions-tasks";

export class TheSageStepfunctionStack extends Stack {
  createLambdaFunction: any;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ==========================================================================
    /**
     * DynamoDB Table
     * we store flight, hotel, and car booking details in the same table
     */
    const bookingTable = new dynamodb.Table(this, "BookingTable", {
      partitionKey: {
        name: "pk",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: dynamodb.AttributeType.STRING,
      },
      writeCapacity: 1,
      readCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ==========================================================================
    /**
     * Lambda Function
     * We need booking and cancellation lambda functions for our 3 services
     * we also need to take payment for the trip
     * 1) Flight booking
     * 2) Hotel booking
     * 3) Payment for the trip
     */
    // Flight Lambdas
    let reserveFlightLambda = this.createLambdaFunction(
      this,
      "ReserveFlightLambda",
      "flights/reserveFlight.handler",
      bookingTable
    );
    let confirmFlightLambda = this.createLambdaFunction(
      this,
      "ConfirmFlightLambda",
      "flights/confirmFlight.handler",
      bookingTable
    );
    let cancelFlightLambda = this.createLambdaFunction(
      this,
      "CancelFlightLambda",
      "flights/cancelFlight.handler",
      bookingTable
    );

    // Hotel Lambdas
    let reserveHotelLambda = this.createLambdaFunction(
      this,
      "ReserveHotelLambda",
      "hotel/reserveHotel.handler",
      bookingTable
    );
    let confirmHotelLambda = this.createLambdaFunction(
      this,
      "ConfirmHotelLambda",
      "hotel/confirmHotel.handler",
      bookingTable
    );
    let cancelHotelLambda = this.createLambdaFunction(
      this,
      "CancelHotelLambda",
      "hotel/cancelHotel.handler",
      bookingTable
    );

    // Payment Lambdas
    let takePaymentLambda = this.createLambdaFunction(
      this,
      "TakePaymentLambda",
      "payment/takePayment.handler",
      bookingTable
    );
    let refundPaymentLambda = this.createLambdaFunction(
      this,
      "RefundPaymentLambda",
      "payment/refundPayment.handler",
      bookingTable
    );

    // ==========================================================================
    /**
     * Step Functions
     * The Process follows a strict order
     * 1) Reserve Flight and Hotel
     * 2) Take Payment
     * 3) Confirm Flight and Hotel
     */
    // Two End States
    const bookingFailed = new stepFunctions.Fail(this, "BookingFailed");
    const bookingSucceeded = new stepFunctions.Pass(this, "BookingSucceeded");

    /**
     * Reserve Flight and Hotel
     */
    // Reserve Hotel
    const reserveHotel = new stepFunctionsTasks.LambdaInvoke(
      this,
      "ReserveHotel",
      {
        lambdaFunction: reserveHotelLambda,
        outputPath: "$.ReserveHotelResult",
      }
    ).addCatch(cancelHotelLambda, {
      resultPath: "$.ReserveHotelError",
    });

    // Cancel Hotel
    const cancelHotel = new stepFunctionsTasks.LambdaInvoke(
      this,
      "CancelHotel",
      {
        lambdaFunction: cancelHotelLambda,
        outputPath: "$.CancelHotelResult",
      }
    )
      .addRetry({
        maxAttempts: 3,
      })
      .next(bookingFailed);

    // Reserve Flight
    const reserveFlight = new stepFunctionsTasks.LambdaInvoke(
      this,
      "ReserveFlight",
      {
        lambdaFunction: reserveFlightLambda,
        outputPath: "$.ReserveFlightResult",
      }
    ).addCatch(cancelFlightLambda, {
      resultPath: "$.ReserveFlightError",
    });

    // Cancel Flight
    const cancelFlight = new stepFunctionsTasks.LambdaInvoke(
      this,
      "CancelFlight",
      {
        lambdaFunction: cancelFlightLambda,
        outputPath: "$.CancelFlightResult",
      }
    )
      .addRetry({
        maxAttempts: 3,
      })
      .next(cancelHotel);

    /**
     * Payment
     */
    // Take Payment
    const takePayment = new stepFunctionsTasks.LambdaInvoke(
      this,
      "TakePayment",
      {
        lambdaFunction: takePaymentLambda,
        outputPath: "$.TakePaymentResult",
      }
    ).addCatch(refundPaymentLambda, {
      resultPath: "$.TakePaymentError",
    });

    // refund payment
    const refundPayment = new stepFunctionsTasks.LambdaInvoke(
      this,
      "RefundPayment",
      {
        lambdaFunction: refundPaymentLambda,
        outputPath: "$.RefundPaymentResult",
      }
    )
      .addRetry({
        maxAttempts: 3,
      })
      .next(cancelFlight);

    /**
     * Confirm Flight and Hotel
     */
    // Confirm Hotel
    const confirmHotel = new stepFunctionsTasks.LambdaInvoke(
      this,
      "ConfirmHotel",
      {
        lambdaFunction: confirmHotelLambda,
        outputPath: "$.ConfirmHotelBookingResult",
      }
    ).addCatch(refundPayment, {
      resultPath: "$.ConfirmHotelBookingError",
    });

    // Confirm Flight
    const confirmFlight = new stepFunctionsTasks.LambdaInvoke(
      this,
      "ConfirmFlight",
      {
        lambdaFunction: confirmFlightLambda,
        outputPath: "$.ConfirmFlightBookingResult",
      }
    ).addCatch(refundPayment, {
      resultPath: "$.ConfirmFlightBookingError",
    });

    // ==========================================================================
    /**
     * Step Functions Chain
     * A collection of states to chain onto
     */
    const definition = stepFunctions.Chain.start(reserveHotel)
      .next(reserveFlight)
      .next(takePayment)
      .next(confirmHotel)
      .next(confirmFlight)
      .next(bookingSucceeded);

    // ==========================================================================
    /**
     * State Machine
     * The state machine is the main resource in AWS Step Functions
     * It is the main entry point for the workflow
     */
    const stateMachine = new stepFunctions.StateMachine(this, "StateMachine", {
      definition,
      timeout: cdk.Duration.minutes(3),
    });

    // ==========================================================================
    /**
     * Saga Lambda Function
     */
    const sagaLambda = new lambda.Function(this, "SagaLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "sagaLambda.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        STATE_MACHINE_ARN: stateMachine.stateMachineArn,
      },
    });

    /**
     * Grant the lambda permission to invoke the state machine
     */
    stateMachine.grantStartExecution(sagaLambda);

    // ==========================================================================
    /**
     * Helper function to create a lambda function
     * @param scope
     * @param id
     * @param handler
     * @param table
     */
    this.createLambdaFunction = (
      scope: Construct,
      id: string,
      handler: string,
      table: dynamodb.Table
    ) => {
      let lambdaFunction = new lambda.Function(scope, id, {
        code: lambda.Code.fromAsset("lambda"),
        handler: handler,
        runtime: lambda.Runtime.NODEJS_14_X,
        environment: {
          BOOKING_TABLE: table.tableName,
        },
      });

      table.grantReadWriteData(lambdaFunction);

      return lambdaFunction;
    };
  }
}
