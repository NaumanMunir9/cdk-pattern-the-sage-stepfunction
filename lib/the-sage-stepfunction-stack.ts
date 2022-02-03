import { Stack, StackProps } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as stepFunctions from "aws-cdk-lib/aws-stepfunctions";
import * as stepFunctionsTasks from "aws-cdk-lib/aws-stepfunctions-tasks";

export class TheSageStepfunctionStack extends Stack {
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
  }
}
