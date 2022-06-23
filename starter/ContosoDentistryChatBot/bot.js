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

        this.onMessage(async (context, next) => {
            try {
                const qnaResults = await this.qnAMaker.getAnswers(context);
                const luisResults = await this.intentRecognizer.executeLuisQuery(context);
                console.log('Luis Results: ' + JSON.stringify(luisResults.luisResult));
                let response = '';
                if (
                    luisResults.luisResult.prediction.topIntent === 'GetAvailability' &&
                luisResults.intents.GetAvailability.score > 0.6
                ) {
                    console.log('Intent recognizer works on GetAvailability');
                    response = await this.dentistScheduler.getAvailability();
                } else if (
                    luisResults.luisResult.prediction.topIntent === 'ScheduleAppointment' &&
                luisResults.intents.ScheduleAppointment.score > 0.6
                ) {
                    console.log('Inside Schedule appointment');
                    const time_ = luisResults.entities.$instance.Time;
                    console.log('Time : ', time_);
                    if (time_ !== undefined || time_ != null) {
                        response = await this.dentistScheduler.scheduleAppointment(time_[0].text);
                    } else {
                        response = 'Kindly indicate the time you would want to schedule appointment or check availability for in the message';
                    }
                } else if (this.qnAMaker.isConfigured) {
                    response = 'NB: \r\n' +
                'Please confirm that the QnA Maker is configured. Kindly check that you have valid `QnAKnowledgebaseId`, `QnAEndpointKey` and `QnAEndpointHostName` in your .env file. \r\n' +
                'You may visit www.qnamaker.ai to create a QnA Maker knowledge base.';
                } else {
                    if (qnaResults[0]) {
                        response = qnaResults[0].answer;
                        console.log('qnaResults[0] answer: ', qnaResults[0].answer);
                    // If no answers were returned from QnA Maker, reply with help.
                    } else {
                        response = 'No QnA Maker answers were found.';
                        console.log('Else : No QnA Maker answers were found.');
                    }
                }
                await context.sendActivity(response);

                // By calling next() you ensure that the next BotHandler is run.
                await next();
            } catch (e) {
                console.error(e);
            }
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
