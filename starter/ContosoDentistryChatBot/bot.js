// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const fetch = require('node-fetch');
// import fetch from 'node-fetch';

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
        this.qnAMaker = new QnAMaker(configuration.QnAConfiguration, qnaOptions);

        // create a DentistScheduler connector

        this.dentistScheduler = new DentistScheduler(
            configuration.SchedulerConfiguration
        );

        // create a IntentRecognizer connector
        this.intentRecognizer = new IntentRecognizer(
            configuration.LuisConfiguration
        );

        const getAvailableTimes = [
            '8am',
            '9am',
            '10am',
            '11am',
            '12pm',
            '1pm',
            '2pm',
            '3pm',
            '4pm'
        ];

        this.onMessage(async (context, next) => {
            const qnaResults = await this.qnAMaker.getAnswers(context);
            const luisResults = await this.intentRecognizer.executeLuisQuery(context);

            if (
                luisResults.luisResult.prediction.topIntent === 'GetAvailability' &&
        luisResults.intents.GetAvailability.score > 0.6
            ) {
                console.log('Intent recognizer works on GetAvailability');

                // fetch('localhost:3000/availability', {
                //     method: 'GET'
                // }).then(
                //     (res) =>
                //         function(res) {
                //             availableTimes = res;
                //         }
                // );
                console.log('Availability : ', getAvailableTimes);
                if (getAvailableTimes !== '') {
                    await context.sendActivity(
                        'These are our available times : ' + getAvailableTimes
                    );
                } else {
                    await context.sendActivity(
                        'Oops! \r\nCould not fetch the availability information '
                    );
                }
                await next();
                return;
            } else if (
                luisResults.luisResult.prediction.topIntent === 'ScheduleAppointment' &&
        luisResults.intents.ScheduleAppointment.score > 0.6 &&
        luisResults.entities.$instance.Time &&
        luisResults.entities.$instance.Time[0]
            ) {
                console.log('Intent recognizer works on ScheduleAppointment');
                const time_ = luisResults.entities.$instance.Time[0].text;

                console.log('Availability : ', getAvailableTimes);
                // fetch('localhost:3000/availability', {
                //     method: 'GET'
                // }).then(
                //     (res) =>
                //         function(res) {
                //             availablePeriod = res;
                //         }
                // );

                // let success = false;
                if (getAvailableTimes.includes(time_)) {
                    // fetch('localhost:3000/availability', {
                    //     method: 'POST',
                    //     body: time_
                    // }).then(
                    //     (res) =>
                    //         function(res) {
                    //             success = true;
                    //         }
                    // );

                    await context.sendActivity(
                        'Your appointment has been successfully scheduled for ' + time_
                    );
                } else {
                    await context.sendActivity(
                        'Your indicated time is not available for booking.\r\nCheck availability first'
                    );
                }
                await next();
                return;
            }
            if (this.qnAMaker.isConfigured) {
                const unconfiguredQnaMessage =
          'NB: \r\n' +
          'Please confirm that the QnA Maker is configured. Kindly check that you have valid `QnAKnowledgebaseId`, `QnAEndpointKey` and `QnAEndpointHostName` in your .env file. \r\n' +
          'You may visit www.qnamaker.ai to create a QnA Maker knowledge base.';

                await context.sendActivity(unconfiguredQnaMessage);
            } else {
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

            /* const replyText = `Echo: ${ context.activity.text }`;
       */
            // console.log('Answer : ' + JSON.stringify(answer[0]));

            // if (
            //     process.env.LuisAppId &&
            //     process.env.LuisAPIKey &&
            //     process.env.LuisAPIHostName
            // // this.intentRecognizer.isConfigured
            // ) {
            //     const LuisModelUrl = process.env.LuisAPIHostName + '/luis/v2.0/apps/' + process.env.LuisAppId + '?subscription-key=' + process.env.LuisAPIKey;

            //     // Create a recognizer that gets intents from LUIS, and add it to the bot
            //     var recognizer = new ActivityHandler.LuisRecognizer(LuisModelUrl);
            //     DentaBot.recognizer(recognizer);
            //     console.log(JSON.stringify());
            //     // let message = 'nothing yet';
            //     // switch (IntentRecognizer.topIntent(luisResponse)) {
            //     // default: {
            //     //     message = 'Now we are unto something';
            //     //     break;
            //     // }
            //     // }
            //     // console.log('Luis : ', message);
            // }

            // if (answer != null) {
            //     await context.sendActivity(
            //         MessageFactory.text(answer[0].answer, answer[0].answer)
            //     );
            // } else {
            //     await context.sendActivity('No QnA Maker answers were found.');
            //     console.log('Else : No QnA Maker answers were found.');
            // }

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
