import { DynamoDB } from "aws-sdk";

const dynamodb = new DynamoDB();

export async function handler(event: any) {
  console.log(`Request: ${JSON.stringify(event, undefined, 2)}`);

  if (event.run_type === "failHotelConfirmation") {
    throw new Error("Hotel Confirmation Failed");
  }

  let bookingID = "";
  if (typeof event.ReserveHotelResult !== "undefined") {
    bookingID = event.ReserveHotelResult.Payload.booking_id;
  }

  const params = {
    TableName: process.env.BOOKING_TABLE || "",
    Key: {
      pk: {
        S: event.trip_id,
      },
      sk: {
        S: `HOTEL#${bookingID}`,
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

  console.log(`Hotel Confirmation: ${JSON.stringify(result, undefined, 2)}`);

  return {
    status: "success",
    message: "Hotel Confirmation Successful",
    booking_id: bookingID,
  };
}
