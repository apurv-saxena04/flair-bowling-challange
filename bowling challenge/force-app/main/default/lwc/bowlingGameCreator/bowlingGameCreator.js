import { LightningElement,wire,api,track } from 'lwc';
import bowlingScoreCalculator from '@salesforce/apex/BowlingScoreCalculator.createGameAndPlayerRecords';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import myResource from '@salesforce/resourceUrl/bowlingImage';

export default class BowlingGameCreator extends LightningElement {

    @track gameName;
    @track totalPlayers;
    @track playerList = [];
    @track playerNames = [];
    @track image = myResource;
    
    handleGameName(event){
        this.gameName = event.target.value;
    }

    handlePlayerSize(event){
        //let element = this.template.querySelector('lightning-input[data-name="temp"]]');
        //var inputList = this.template.querySelectorAll('lightning-input[data-name="totalPlayers"]');
        this.playerList = [];
        this.totalPlayers = event.target.value;
        console.log('Players : '+this.totalPlayers);
        for(var i=1;i<=this.totalPlayers;i++){
            this.playerList.push('player'+i);
        }
    }

    handleClick(){
        console.log('Submit button clicked');
        var inputList = this.template.querySelectorAll('lightning-input[data-name="playerName"]');
        inputList.forEach(inp => {
            this.playerNames.push({
                player : inp.name,
                value : inp.value
            });

        });
        console.log('playerNames :' +this.playerNames);

        bowlingScoreCalculator({gameName : this.gameName, payload : JSON.stringify(this.playerNames)})
        .then(result => {
            const toast = new ShowToastEvent({
                title: 'Success',
                message: 'Game and players entered successfully.',
                variant: 'success',
            });
            this.dispatchEvent(toast);

            const gameStart = new CustomEvent('gamestart', {detail :{'gameid' : result}});
            this.dispatchEvent(gameStart);
        })
        .catch(error => {
            const toast = new ShowToastEvent({
                title: 'Error',
                message: error.message,
                variant: 'error',
            });
            this.dispatchEvent(toast);
        })
        .finally(() => {
            
        });


    }
}