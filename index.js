// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const rp = require('request-promise-native');
        
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
}

    function convert(url, callType, accType) {
        
        var options = {
          uri: url,
          method: "GET",
          resolveWithFullResponse: true  
        }
        console.log(url);
        return rp(options)
            .then(function(data) {
                var money;
                var jsonList = JSON.parse(data.body);
                if(accType == 'savings') {
                    money = jsonList[0][callType];
                } else if(accType == 'credit') {
                    money = jsonList[1][callType];
                } else if (accType == 'checking') {
                    money = jsonList[2][callType];
                }
                return Promise.resolve(money);
            });
    }

    function get_money(agent) {
        console.log('start');
        const bankAccount = agent.parameters['bank'];
        const bankAction = agent.parameters['bank_action'];
        const accType = agent.parameters['account_type'];
        var API_key = 'key=bbf799b883b74d8e9013f3fdd3df21e9';
        var customer_id = '5bcb4445322fa06b67793df5';
        var capital_one_url = 'http://api.reimaginebanking.com/customers/' + customer_id + '/accounts?' + API_key;
        var citi_url = 'https://pastebin.com/raw/6PyJhMez'
        
        if (bankAccount=='capital one') {
        	console.log('we in this capital');
        	return convert(capital_one_url, bankAction, accType)
            .then((money) => {
                agent.add('Your Capital One ' + accType + ' ' + bankAction + ' is: '+money +' dollars');
                return Promise.resolve();
        	});
        	
        } else if (bankAccount == 'citibank') {
        	console.log('we in the citi');
        	
            return convert(citi_url, bankAction, accType)
            .then((money) => {
                
                if(bankAction == 'paymentDueDate' || bankAction == 'lastStatementDate'|| bankAction == 'lastPaymentDate')
                {
                    agent.add('Your Citibank ' + accType + ' ' + bankAction + ' is: '+money );
                }
                else
                {
                    agent.add('Your Citibank ' + accType + ' ' + bankAction + ' is: '+money +' dollars');
                }
                
                return Promise.resolve();
            });
        }
    }
    
  
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('plutus_get', get_money);
  intentMap.set('credit', get_money);
  
  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
