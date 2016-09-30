'use strict';

let Wit = null;
let interactive = null;
var Client = require('node-rest-client').Client;
var res = "";
var botData = "";

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


const actions = {
  send(request, response) {
    //console.log('sending...', JSON.stringify(response));
    console.log(response.text);
    botData = botData + response.text + "<br/>";
    if( response.quickreplies!= undefined ) {
      console.log(response.quickreplies);
      botData = botData + response.quickreplies + "<br/>";
    }
    return Promise.resolve();
  },
  cancelOrder({context, entities}) {
    //console.log("------ Cancellation Function Called ! ---------");
    //console.log("Order No : " ,JSON.stringify(entities));
    try {
          //console.log(context);
          //console.log(entities);
          console.log("Processing your order for cancellation...");
          var orderId = entities["order_id"][0]["value"];
          //var paymentMethod = entities["method"][0]["value"];
          var request =  {
            "initiated_by": "Bot Batola",
            "payment_method": "source",
            "reason_detail": "",
            "reason_id": 156,
            "source": "Bot Batola"
          };
          res = "";
          res = clientRequest("http://test-athena.lenskart.com:8041/"+orderId+"/cancel-invoice","POST",request);
          setTimeout(function(){
            if(res!="" && res.statusCode >=200 && res.statusCode<=300 ) {
              console.log(res.message);
              botData = res.message+"<br/>";
            } else {
              console.log("Order cancellation failed... Please try after some time !!");
              botData = "Order cancellation failed... Please try after some time !!<br/>";
            }
          },1000);
    } catch(e) {
      console.log("Order cancellation failed... Please try after some time !!");
      botData = "Order cancellation failed... Please try after some time !!<br/>";
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
            botData = "Your order current status  is " + res["orderList"][0]["status"][0]+"<br/>";
          } else {
            console.log("No data found for order number " + orderId + ", Please verify your order number again !!");
            botData = "No data found for order number " + orderId + ", Please verify your order number again !!<br/>";
          }
        },1000);
    } catch(e) {
      console.log("Some error occured ... Please try after some time !!");
      botData = "Some error occured ... Please try after some time !!<br/>";
    }
    return Promise.resolve();
  },
  validatePhone({context, entities}) {
      var regex = /^\d{10}$/;
      if (regex.test(entities["phone_number"][0]["value"])) {
        console.log("phone number is valid");
        botData = "phone number is valid<br/>";
      } else {
        console.log("Please enter a valid phone number !!");
        botData = "Please enter a valid phone number !!<br/>";
      }
  },
    getEligibleOrders({context, entities}) {
    //console.log("------ Order Status Function Called ! ---------");
    //console.log("Order No : " ,JSON.stringify(entities));
    //console.log("Processing your order Information...");
    try {
        var phone = entities["phone_number"][0]["value"];
        var request =  {
                          "advancedSearchData": {
                                                "telephone": phone
                                              }
                        }
        res = "";
        res = clientRequest("http://test-athena.lenskart.com:8765/api/v2/order/search/order?start=0&rows=100","POST",request);
        setTimeout(function(){
          if(res!="" && res.statusCode >=200 && res.statusCode<=300 && res.numFound > 0 ) {
            //console.log("Order Information : ");
            //console.log("Order State : " + res["orderList"][0]["state"][0]);
            console.log("Latest orders are " + phone + " :- ");
            botData = "Latest orders are " + phone + " :- <br/>";
            var i =0;
            var str= [];
            for (i = 0; i < 5; i++) {
              str.push(res["orderList"][i]["increment_id"]);
            }
            console.log(str.join(", ") + "....");
            botData = botData + str.join(", ") + "....<br/>";
          } else {
            console.log("No data found for phone no " + phone + ", Please verify your phone number again !!");
            botData = "No data found for phone no " + phone + ", Please verify your phone number again !!<br/>";
          }
        },1000);
    } catch(e) {
      console.log("Some error occured ... Please try after some time !!");
      botData = "Some error occured ... Please try after some time !!<br/>";
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
            botData = "Your estimated date of delivery is " + res["delivery_date"] + " and it will be dispatched by " + res["dispatch_date"]+"<br/>";
          } else {
            if( res!="" && res.statusCode == 404 ) {
              console.log(res.error_message);
              botData = res.error_message + "<br/>";
            } else {
              console.log("Some error occured ... Please try after some time !!");
              botData = "Some error occured ... Please try after some time !!<br/>";
            }
          }
        },1000);
    } catch(e) {
      console.log("Some error occured ... Please try after some time !!");
      botData = "Some error occured ... Please try after some time !!<br/>";
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

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    console.log(msg);
    botData = "";
    client.runActions("", msg, {})
    .then((data) => {
      //console.log(data);
    })
    setTimeout(function(){io.emit('chat message', botData)},5000);
  });
});

http.listen(3000, function(){
  console.log('listening on localhost:3000');
});