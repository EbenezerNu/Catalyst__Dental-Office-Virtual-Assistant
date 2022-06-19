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

            const replyText = `Echo: ${ context.activity.text }`;
            await context.sendActivity(MessageFactory.text(replyText, replyText));
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            // write a custom greeting
            const welcomeText =
        `Welcome to Dental Virtual Assistant. 
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
