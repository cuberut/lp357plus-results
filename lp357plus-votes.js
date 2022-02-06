// ==UserScript==
// @name       LP357+ votes
// @version    0.2
// @author     cuberut
// @include    https://lista.radio357.pl/app/lista/wyniki/*
// @updateURL  https://raw.githubusercontent.com/cuberut/lp357plus/main/lp357plus.js
// @grant      GM_addStyle
// ==/UserScript==

GM_addStyle("div#votes { position: absolute; left: 5px; width: auto; text-align: center; }");

const getTagVotes = (item) => `<div id="votes"><i class="${item.last ? 'fas' : 'far'} fa-star"></i><div class="small">(${item.count})</div></div>`;
const getSummary = (amount) => `<li class="list-group-item"><div class="chart-summary__item"><span>moje głosy</span><span><span>${amount}</span><i class="fas fa-star fa-xs"></i></span></div></li>`;

const chartNo = parseInt(document.location.pathname.split("/").pop());

const myVotes = {};

for (var i = 1; i < chartNo+1; i++) {
    const votes = JSON.parse(localStorage.getItem("myVotes" + i));
    const last = (i == chartNo);

    if (votes) {
        votes.forEach(id => {
            if (myVotes[id]) {
                myVotes[id].count++;
            } else {
                myVotes[id] = { count: 1 };
            }
            if (last) {
                myVotes[id].last = true;
            }
        });
    }
}

const mainChart = [];
const waitingRoom = [];

XMLHttpRequest.prototype.realSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function(value) {
    this.addEventListener("load", function(){
        const textResponse = this.responseText;
        const jsonResponse = JSON.parse(textResponse);
        const dataResponse = jsonResponse.data.chart.results;
        mainChart.push(...dataResponse.mainChart);
        waitingRoom.push(...dataResponse.waitingRoom);
    }, false);
    this.realSend(value);
};

var ajaxRequest = new XMLHttpRequest();
ajaxRequest.open("GET", "https://api.lista.radio357.pl/api/charts/lista/" + chartNo, false);
ajaxRequest.send(null);

let setList = [];

if (mainChart.length) {
    setList = mainChart.map((item, i) => ({id: item.id, votes: myVotes[item.id]}));
}

(function() {
    let voteList;
    const interval = setInterval(() => {
        voteList = document.querySelector('.chart-list');
        if (voteList) {
            const items = [...voteList.querySelectorAll('.list-group-item')];
            let sumCounter = 0
            items.forEach((item, i) => {
                if (setList[i].votes) {
                    item.querySelector('.chart-item').insertAdjacentHTML('beforeend', getTagVotes(setList[i].votes));
                    if (setList[i].votes.last) {
                        sumCounter++;
                    }
                }
            });

            const summary = document.querySelector('div.chart-summary ul.list-group');
            summary.insertAdjacentHTML('beforeend', getSummary(sumCounter));
            clearInterval(interval);
        }
    }, 0);
})();
