import * as AWS from "aws-sdk";

const stepFunctions = new AWS.StepFunctions({ region: "us-east-1" });

export async function handler(event: any, context: any, callback: any) {
  console.log(`Request: ${JSON.stringify(event, undefined, 2)}`);

  let runType = "success";
  let tripID = `5c12d94a-ee6a-40d9-889b-1d49142248b7`;

  if (null != event.queryStringParameters) {
    if (typeof event.queryStringParameters.runType != "undefined") {
      runType = event.queryStringParameters.runType;
    }

    if (typeof event.queryStringParameters.tripID != "undefined") {
      tripID = event.queryStringParameters.tripID;
    }
  }

  let input = {
    trip_id: tripID,
    depart: "Karachi",
    depart_at: "2022-02-10T06:00:00.000Z",
    arrive: "Dublin",
    arrive_at: "2022-02-12T08:00:00.000Z",
    hotel: "holiday inn",
    check_in: "2022-02-10T12:00:00.000Z",
    check_out: "2022-02-12T14:00:00.000Z",
    rental: "Volvo",
    rental_from: "2022-02-10T00:00:00.000Z",
    rental_to: "2022-02-12T00:00:00.000Z",
    run_type: runType,
  };

  const params = {
    stateMachineArn: process.env.STATE_MACHINE_ARN || "",
    input: JSON.stringify(input),
  };

  stepFunctions.startExecution(params, (err, data) => {
    if (err) {
      console.log(`Error: ${JSON.stringify(err, undefined, 2)}`);
      const response = {
        statusCode: 500,
        body: JSON.stringify({
          message: err.message,
        }),
      };
      callback(null, response);
    } else {
      console.log(`Response: ${JSON.stringify(data, undefined, 2)}`);
      const response = {
        statusCode: 200,
        body: JSON.stringify({
          message: "The booking system is processing your request",
        }),
      };
      callback(null, response);
    }
  });
}
