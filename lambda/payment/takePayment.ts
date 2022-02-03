import * as AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB();

export const handler = async (event: any, context: any) => {
  console.log(`Request: ${JSON.stringify(event, undefined, 2)}`);

  let flightBookingID = "";
  if (typeof event.ReserveFlightResult !== "undefined") {
    flightBookingID = event.ReserveFlightResult.Payload.booking_id;
  }

  let hotelBookingID = "";
  if (typeof event.ReserveHotelResult !== "undefined") {
    hotelBookingID = event.ReserveHotelResult.Payload.booking_id;
  }

  let paymentID = hashCode(
    `${event.trip_id}${hotelBookingID}${flightBookingID}`
  );

  if (event.run_type === "failPayment") {
    throw new Error("Failed to Book the Flights and Hotel");
  }

  const params = {
    TableName: process.env.BOOKING_TABLE || "",
    Item: {
      pk: {
        S: event.trip_id,
      },
      sk: {
        S: `PAYMENT#${paymentID}`,
      },
      type: {
        S: "Payment",
      },
      trip_id: {
        S: event.trip_id,
      },
      id: {
        S: paymentID,
      },
      amount: {
        S: "450.00",
      },
      currency: {
        S: "USD",
      },
      transaction_status: {
        S: "pending",
      },
    },
  };

  const result = await dynamodb
    .putItem(params)
    .promise()
    .catch((err) => {
      throw new Error(err);
    });

  console.log(`Payment Taken: ${JSON.stringify(result, undefined, 2)}`);

  return {
    status: "success",
    message: "Payment Taken Successful",
    booking_id: paymentID,
  };
};

function hashCode(s: string) {
  let h: any;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return "" + Math.abs(h);
}
