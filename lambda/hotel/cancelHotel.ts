import * as AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB();

export const handler = async (event: any, context: any) => {
  console.log(`Request: ${JSON.stringify(event, undefined, 2)}`);

  if (Math.random() < 0.4) {
    throw new Error("Internal Server Error");
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
  };

  const result = await dynamodb
    .deleteItem(params)
    .promise()
    .catch((err) => {
      throw new Error(err);
    });

  console.log(
    `Hotel Booking Cancelled: ${JSON.stringify(result, undefined, 2)}`
  );

  return {
    status: "success",
    message: "Hotel Booking Cancelled",
  };
};
