// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');

const { QnAMaker } = require('botbuilder-ai');
const DentistScheduler = require('./dentistscheduler');
const IntentRecognizer = require('./intentrecognizer');

class DentaBot extends ActivityHandler {
    constructor(configuration, qnaOptions) {
    // call the parent constructor
        super();
        if (!configuration) {
            throw new Error(
                '[QnaMakerBot]: Missing parameter. configuration is required'
            );
        }

        // create a QnAMaker connector
        this.QnAMaker = new QnAMaker(configuration);

        // create a DentistScheduler connector

        this.DentistScheduler = new DentistScheduler(configuration);

        // create a IntentRecognizer connector
        this.IntentRecognizer = new IntentRecognizer(configuration);

        this.onMessage(async (context, next) => {
            // send user input to QnA Maker and collect the response in a variable
            // don't forget to use the 'await' keyword

            // send user input to IntentRecognizer and collect the response in a variable
            // don't forget 'await'

            // determine which service to respond with based on the results from LUIS //

            // if(top intent is intentA and confidence greater than 50){
            //  doSomething();
            //  await context.sendActivity();
            //  await next();
            //  return;
            // }
            // else {...}
            // const results = IntentRecognizer.executeLuisQuery(context);
            // const topIntent = results.luisResult.topScoringIntent;

            // switch (topIntent.intent) {
            // case 'GetAvailability':
            //     await context.sendActivity('Hey! Ask me something to get started.');
            //     break;
            // case 'ScheduleAppointment':
            //     await updateInfoIntent.handleIntent(turnContext);
            //     break;
            // }

            if (!this.QnAMaker) {
                const unconfiguredQnaMessage =
          'NOTE: \r\n' +
          'QnA Maker is not configured. To enable all capabilities, add `QnAKnowledgebaseId`, `QnAEndpointKey` and `QnAEndpointHostName` to the .env file. \r\n' +
          'You may visit www.qnamaker.ai to create a QnA Maker knowledge base.';

                await context.sendActivity(unconfiguredQnaMessage);
            } else {
                console.log('Calling QnA Maker');

                const qnaResults = await QnAMaker.getAnswers(context);
                console.log('qnaResults : ', qnaResults);

                // If an answer was received from QnA Maker, send the answer back to the user.
                if (qnaResults[0]) {
                    await context.sendActivity(qnaResults[0].answer);
                    console.log('qnaResults[0] answer: ', qnaResults[0].answer);
                    // If no answers were returned from QnA Maker, reply with help.
                } else {
                    await context.sendActivity('No QnA Maker answers were found.');
                    console.log('Else : No QnA Maker answers were found.');
                }
            }

            // const replyText = `Echo: ${ context.activity.text }`;
            // await context.sendActivity(MessageFactory.text(replyText, replyText));
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            // write a custom greeting
            const welcomeText = `Welcome to Dental Virtual Assistant. 
        Please our assistance is currently limited to checking availability and scheduling an appointment. 
        Kindly take note of that.`;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(
                        MessageFactory.text(welcomeText, welcomeText)
                    );
                }
            }
            // by calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.DentaBot = DentaBot;
