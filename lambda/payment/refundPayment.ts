import * as AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB();

export const handler = async (event: any, context: any) => {
  console.log(`Request: ${JSON.stringify(event, undefined, 2)}`);

  if (Math.random() < 0.4) {
    throw new Error("Internal Server Error");
  }

  let paymentID = "";
  if (typeof event.TakePaymentResult !== "undefined") {
    paymentID = event.TakePaymentResult.Payload.booking_id;
  }

  const params = {
    TableName: process.env.BOOKING_TABLE || "",
    Key: {
      pk: {
        S: event.trip_id,
      },
      sk: {
        S: `PAYMENT#${paymentID}`,
      },
    },
  };

  const result = await dynamodb
    .deleteItem(params)
    .promise()
    .catch((err) => {
      throw new Error(err);
    });

  console.log(`Payment Refunded: ${JSON.stringify(result, undefined, 2)}`);

  return {
    status: "success",
    message: "Payment Refunded",
  };
};
