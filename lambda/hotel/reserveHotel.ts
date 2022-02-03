import * as AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB();

export const handler = async (event: any, context: any) => {
  console.log(`Request: ${JSON.stringify(event, undefined, 2)}`);

  let hotelBookingID = hashCode(
    `${event.trip_id}${event.depart}${event.arrive}`
  );

  if (event.run_type === "failHotelReservation") {
    throw new Error("Hotel reservation failed");
  }

  const params = {
    TableName: process.env.BOOKING_TABLE || "",
    Item: {
      pk: {
        S: event.trip_id,
      },
      sk: {
        S: `HOTEL#${hotelBookingID}`,
      },
      type: {
        S: "Hotel",
      },
      trip_id: {
        S: event.trip_id,
      },
      id: {
        S: hotelBookingID,
      },
      hotel: {
        S: event.hotel,
      },
      check_in: {
        S: event.check_in,
      },
      check_out: {
        S: event.check_out,
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

  console.log(`Hotel Reservation: ${JSON.stringify(result, undefined, 2)}`);

  return {
    status: "success",
    message: "Hotel Reservation Successful",
    booking_id: hotelBookingID,
  };
};

function hashCode(s: string) {
  let h: any;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return "" + Math.abs(h);
}
