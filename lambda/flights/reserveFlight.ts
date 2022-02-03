import * as AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB();

export const handler = async (event: any, context: any) => {
  console.log(`Request: ${JSON.stringify(event, undefined, 2)}`);

  let flightBookingID = hashCode(
    `${event.trip_id}${event.depart}${event.arrive}`
  );

  if (event.run_type === "failFlightReservation") {
    throw new Error("Flight reservation failed");
  }

  const params = {
    TableName: process.env.BOOKING_TABLE || "",
    Item: {
      pk: {
        S: event.trip_id,
      },
      sk: {
        S: `FLIGHT#${flightBookingID}`,
      },
      type: {
        S: "Flight",
      },
      trip_id: {
        S: event.trip_id,
      },
      id: {
        S: flightBookingID,
      },
      depart: {
        S: event.depart,
      },
      depart_at: {
        S: event.depart_at,
      },
      arrive: {
        S: event.arrive,
      },
      arrive_at: {
        S: event.arrive_at,
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

  console.log(`Reserved flight: ${JSON.stringify(result, undefined, 2)}`);

  return {
    status: "success",
    message: "Flight reservation successful",
    booking_id: flightBookingID,
  };
};

function hashCode(s: string) {
  let h: any;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return "" + Math.abs(h);
}
