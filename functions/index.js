const functions = require('firebase-functions');
const cors = require('cors')({ origin: true});
const admin = require('firebase-admin');
const serviceAccount = require(".serviceAccountKey.json");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const { SessionsClient } = require('dialogflow');


exports.dialogflowGateway = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    const { queryInput, sessionId } = request.body;

    const sessionClient = new SessionsClient({ credentials: serviceAccount  });
    const session = sessionClient.sessionPath('chatbot-347406', sessionId);

    const responses = await sessionClient.detectIntent({ session, queryInput});
    const result = responses[0].queryResult;

    response.send(result);
  });
});

const { WebhookClient } = require('dialogflow-fulfillment');

exports.dialogflowWebhook = functions.https.onRequest(async (request, response) => {
    const agent = new WebhookClient({ request, response });

    const result = request.body.queryResult;

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }


    async function userOnboardingHandler(agent) {

     // Do backend stuff here
     const db = admin.firestore();
     const request_car = db.collection('request_car').doc();

     const { given_name, availibility } = result.parameters;

      await request_car.set({ given_name, availibility })
      agent.add(`Pesanan ada sedang diproses!`);
    }


    let intentMap = new Map();
    intentMap.set('UserOnboarding', userOnboardingHandler);
    agent.handleRequest(intentMap);
});
