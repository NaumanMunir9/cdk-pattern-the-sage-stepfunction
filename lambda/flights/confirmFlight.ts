import { DynamoDB } from "aws-sdk";

const dynamodb = new DynamoDB();

export async function handler(event: any) {
  console.log(`Request: ${JSON.stringify(event, undefined, 2)}`);

  if (event.run_type === "failFlightConfirmation") {
    throw new Error("Flight confirmation failed");
  }

  let bookingID = "";
  if (typeof event.ReserveFlightResult !== "undefined") {
    bookingID = event.ReserveFlightResult.Payload.booking_id;
  }

  const params = {
    TableName: process.env.BOOKING_TABLE || "",
    Key: {
      pk: {
        S: event.trip_id,
      },
      sk: {
        S: `FLIGHT#${bookingID}`,
      },
    },
    UpdateExpression: "set transaction_status = :booked",
    ExpressionAttributeValues: {
      ":booked": {
        S: "confirmed",
      },
    },
  };

  const result = await dynamodb
    .updateItem(params)
    .promise()
    .catch((err) => {
      throw new Error(err);
    });

  console.log(`Confirmed flight: ${JSON.stringify(result, undefined, 2)}`);

  return {
    status: "success",
    message: "Flight confirmed",
    booking_id: bookingID,
  };
}
