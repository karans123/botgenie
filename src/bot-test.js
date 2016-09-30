'use strict';

let Wit = null;
let interactive = null;
var Client = require('node-rest-client').Client;
var res = "";

try {
  // if running from repo
  Wit = require('../').Wit;
  interactive = require('../').interactive;
} catch (e) {
  Wit = require('node-wit').Wit;
  interactive = require('node-wit').interactive;
}


const accessToken = (() => {
  if (process.argv.length !== 3) {
    console.log('usage: node examples/joke.js <wit-access-token>');
    process.exit(1);
  }
  return process.argv[2];
})();

// Joke example
// See https://wit.ai/patapizza/example-joke

const allJokes = {
  chuck: [
    'Chuck Norris counted to infinity - twice.',
    'Death once had a near-Chuck Norris experience.',
  ],
  tech: [
    'Did you hear about the two antennas that got married? The ceremony was long and boring, but the reception was great!',
    'Why do geeks mistake Halloween and Christmas? Because Oct 31 === Dec 25.',
  ],
  default: [
    'Why was the Math book sad? Because it had so many problems.',
  ],
};

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

const actions = {
  send(request, response) {
    //console.log('sending...', JSON.stringify(response));
    console.log(response.text);
    if( response.quickreplies!= undefined )
      console.log(response.quickreplies);
    return Promise.resolve();
  },
  merge({entities, context, message, sessionId}) {
    return new Promise(function(resolve, reject) {
      delete context.joke;
      const category = firstEntityValue(entities, 'category');
      if (category) {
        context.cat = category;
      }
      const sentiment = firstEntityValue(entities, 'sentiment');
      if (sentiment) {
        context.ack = sentiment === 'positive' ? 'Glad you liked it.' : 'Hmm.';
      } else {
        delete context.ack;
      }
      return resolve(context);
    });
  },
  cancelOrder({context, entities}) {
    //console.log("------ Cancellation Function Called ! ---------");
    //console.log("Order No : " ,JSON.stringify(entities));
    try {
          console.log("Processing your order for cancellation...");
          var orderId = context["order_id"][0]["value"];
          var paymentMethod = entities["method"][0]["value"];
          var request =  {
            "initiated_by": "Bot Batola",
            "payment_method": paymentMethod,
            "reason_detail": "",
            "reason_id": 156,
            "source": "Bot Batola"
          };
          res = "";
          res = clientRequest("http://test-athena.lenskart.com:8041/"+orderId+"/cancel-invoice","POST",request);
          setTimeout(function(){
            if(res!="" && res.statusCode >=200 && res.statusCode<=300 ) {
              console.log(res.message);
            } else {
              console.log("Order cancellation failed... Please try after some time !!");
            }
          },1000);
    } catch(e) {
      console.log("Order cancellation failed... Please try after some time !!");
    }
    return Promise.resolve();
  },
  getOrderStatus({context, entities}) {
    //console.log("------ Order Status Function Called ! ---------");
    //console.log("Order No : " ,JSON.stringify(entities));
    //console.log("Processing your order Information...");
    try {
        var orderId = entities["order_id"][0]["value"];
        var request =  {
                          "normalSearchData": {
                                                "searchOrderParam": orderId
                                              }
                        }
        res = "";
        res = clientRequest("http://test-athena.lenskart.com:8765/api/v2/order/search/order?start=0&rows=100","POST",request);
        setTimeout(function(){
          if(res!="" && res.statusCode >=200 && res.statusCode<=300 && res.numFound > 0 ) {
            //console.log("Order Information : ");
            //console.log("Order State : " + res["orderList"][0]["state"][0]);
            console.log("Your order current status  is " + res["orderList"][0]["status"][0]);
          } else {
            console.log("No data found for order number " + orderId + ", Please verify your order number again !!");
          }
        },1000);
    } catch(e) {
      console.log("Some error occured ... Please try after some time !!");
    }
    return Promise.resolve();
  },
  getDeliveryEstimate({context, entities}) {
    //console.log("------ Delivery Estimate Function Called ! ---------");
    //console.log("Order No : " ,JSON.stringify(entities));
    try {
        var orderId = entities["order_id"][0]["value"];
        res = "";
        res = clientRequest("http://athena.lenskart.com:9090/shipping/estimate/"+orderId,"GET","");
        setTimeout(function(){
          if(res!="" && res.statusCode >=200 && res.statusCode<=300 ) {
            console.log("Your estimated date of delivery is " + res["delivery_date"] + " and it will be dispatched by " + res["dispatch_date"]);
          } else {
            if( res!="" && res.statusCode == 404 )
              console.log(res.error_message);
            else
              console.log("Some error occured ... Please try after some time !!");
          }
        },1000);
    } catch(e) {
      console.log("Some error occured ... Please try after some time !!");
    }
    return Promise.resolve();

  }
};

function clientRequest(url, method, request) {
  if( method == "GET") {
    var client = new Client();

    client.get(url, function (data, response) {
        data["statusCode"] = response.statusCode;
        //console.log(data);
        //console.log(response);
        res = data;
        return data;
    });
  } else if( method == "POST" ) {
    var client = new Client();
    var args = {
        data: request,
        headers: { "Content-Type": "application/json" }
    };
     
    client.post(url, args, function (data, response) {
        data["statusCode"] = response.statusCode;
        //console.log(data);
        //console.log(response);
        res = data;
        return data;
    });
  }
  return "";
}

const client = new Wit({accessToken, actions});
interactive(client);
