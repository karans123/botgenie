'use strict';

let Wit = null;
let interactive = null;
var Client = require('node-rest-client').Client;
var botData = "";
var httpClient = new Client();

try {
    // if running from repo
    Wit = require('./').Wit;
    interactive = require('./').interactive;
} catch (e) {
    Wit = require('node-wit').Wit;
    interactive = require('node-wit').interactive;
}


const accessToken = (() => {
        if (process.argv.length !== 3) {
    console.log('usage: node bot-server.js <wit-access-token>');
    process.exit(1);
}
return process.argv[2];
})();

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
        //console.log("request -- " + JSON.stringify(request));
        return new Promise(function(resolve, reject) {
            console.log("BotGenie : " + response.text);
            botData = botData + response.text + "<br/>";
            if( response.quickreplies!= undefined ) {
                console.log(response.quickreplies);
                botData = botData + response.quickreplies + "<br/>";
            }
            return resolve();
        });
    },

    merge({context, entities}) {
        return new Promise(function(resolve, reject) {

            if(entities) {
                for (var key in entities) {
                    if (entities.hasOwnProperty(key)) {

                        const value = firstEntityValue(entities, key);
                        if (value) {
                            if(key == "email") {
                                context.email = value;
                            } else if(key == "hto_booking") {
                                context.hto_booking = value;
                            } else if(key == "mobile") {
                                context.mobile = value;
                            } else if(key == 'customer_address') {
                                context.customer_address = value;
                            } else if(key == 'order_cancel') {
                                context.order_cancel = value;
                            } else if(key == 'order_id') {
                                context.order_id = value;
                            } else if(key == 'refund_method') {
                                context.refund_method = value;
                            } else if(key == 'order_status') {
                                context.order_status = value;
                            } else if(key == 'shipping_estimate') {
                                context.shipping_estimate = value;
                            }
                        }
                    }
                }
            }
            return resolve(context);
        });
    },

  cancelOrder(obj) {
    try {
          console.log("Processing your order for cancellation...");
          var orderId = obj.context.order_id;
          console.log(JSON.stringify(obj.context));
          var request =  {
            "initiated_by": "BotGinie",
            "payment_method": obj.context.refund_method,
            "reason_detail": "",
            "reason_id": 156,
            "source": "BotGinie"
          };
          var args = {
            data: request,
            headers: { "Content-Type": "application/json" }
          };
          httpClient.post("http://test-athena.lenskart.com:8041/"+orderId+"/cancel-invoice", args, function (data, response) {
            data["statusCode"] = response.statusCode;
            if(data!="" && data.statusCode >=200 && data.statusCode<=300 ) {
              console.log(data.message);
              botData = data.message+"<br/>";
            } else {
              console.log("Order cancellation failed... Please try after some time !!");
              botData = "Order cancellation failed... Please try after some time !!<br/>";
            }
          });
    } catch(e) {
      console.log("Order cancellation failed... Please try after some time !!");
      botData = "Order cancellation failed... Please try after some time !!<br/>";
    }
    return Promise.resolve();
  },

  getOrderStatus(obj) {

    try {
        var orderId = obj.context.order_id;
        var request =  {
                          "normalSearchData": {
                                                "searchOrderParam": orderId
                                              }
                        }
        var args = {
          data: request,
          headers: { "Content-Type": "application/json" }
        };
        httpClient.post("http://test-athena.lenskart.com:8765/api/v2/order/search/order?start=0&rows=100", args, function (data, response) {
            data["statusCode"] = response.statusCode;
            if(data!="" && data.statusCode >=200 && data.statusCode<=300 && data.numFound > 0 ) {
              console.log("Your order current status  is " + data["orderList"][0]["status"][0]);
              botData = "Your order current status  is " + data["orderList"][0]["status"][0]+"<br/>";
            } else {
              console.log("No data found for order number " + orderId + ", Please verify your order number again !!");
              botData = "No data found for order number " + orderId + ", Please verify your order number again !!<br/>";
            }
        });
    } catch(e) {
      console.log("Some error occured ... Please try after some time !!");
      botData = "Some error occured ... Please try after some time !!<br/>";
    }
    return Promise.resolve();
  },

    getEligibleOrders(obj) {
    try {
        //console.log(JSON.stringify(obj.context));

        var phone = obj.context.mobile;
        var request =  {
                          "advancedSearchData": {
                                                "telephone": phone
                                              }
                        }
        var args = {
        data: request,
          headers: { "Content-Type": "application/json" }
        };
        httpClient.post("http://test-athena.lenskart.com:8765/api/v2/order/search/order?start=0&rows=100", args, function (data, response) {
            data["statusCode"] = response.statusCode;

            if(data!="" && data.statusCode >=200 && data.statusCode<=300 && data.numFound > 0 ) {
              console.log("Latest orders are " + phone + " :- ");
              botData = "Latest orders are " + phone + " :- <br/>";
              var i =0;
              var str= [];
              for (i = 0; i < 5; i++) {
                str.push(data["orderList"][i]["increment_id"]);
              }
              console.log(str.join(", ") + "....");
              botData = botData + str.join(", ") + "....<br/>";
            } else {
              console.log("No data found for phone no " + phone + ", Please verify your phone number again !!");
              botData = "No data found for phone no " + phone + ", Please verify your phone number again !!<br/>";
            }
        });
    } catch(e) {
      console.log("Some error occured ... Please try after some time !!");
      botData = "Some error occured ... Please try after some time !!<br/>";
    }
    return Promise.resolve();
  },
  deliveryEstimate(obj) {

        try {
            var orderId = obj.context.order_id;
            httpClient.get("http://athena.lenskart.com:9090/shipping/estimate/" + orderId, function (data, response) {
                data["statusCode"] = response.statusCode;

                if(data !="" && data.statusCode >=200 && data.statusCode<=300 ) {
                    console.log("Your estimated date of delivery is " + data["delivery_date"] + " and it will be dispatched by " + data["dispatch_date"]);
                    botData = "Your estimated date of delivery is " + data["delivery_date"] + " and it will be dispatched by " + data["dispatch_date"]+"<br/>";
                } else {
                    if( data!="" && data.statusCode == 404 ) {
                        console.log(data.error_message);
                        botData = data.error_message + "<br/>";
                    } else {
                        console.log("Some error occured ... Please try after some time !!");
                        botData = "Some error occured ... Please try after some time !!<br/>";
                    }
                }
            });
        } catch(e) {
            console.log("Some error occured ... Please try after some time !!");
            botData = "Some error occured ... Please try after some time !!<br/>";
        }
        return Promise.resolve();

    }
};


const client = new Wit({accessToken, actions});

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname + '/images'));
var sessionId = guid();//new Date().toISOString();
const context = {};
io.on('connection', function(socket){

    socket.on('chat message', function(msg){
        botData = "";
        client.runActions(sessionId, msg, context)
            .then((data) => {
                //console.log("hi" + JSON.stringify(data));
            //botData=botData+context+"<br/>";
            io.emit('chat message', botData);
        });

    });
});


http.listen(3000, function(){
    //interactive(client);
    console.log('listening on localhost:3000');
});


function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}
interactive(client);