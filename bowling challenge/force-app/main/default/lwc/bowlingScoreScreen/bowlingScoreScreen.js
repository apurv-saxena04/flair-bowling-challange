import { LightningElement,api,wire } from 'lwc';
import getScore from '@salesforce/apex/BowlingScoreCalculator.getPlayers';
import { getRecord } from 'lightning/uiRecordApi';

const columns = [
    { label: 'Name', fieldName: 'Name'},
    { label: 'Score', fieldName: 'Score'}
]

export default class BowlingScoreScreen extends LightningElement {

    @api gameId;
    dataRec = [];
    columns = columns;

    /*@wire(getRecord, {gameId: this.gameId})
    wiredScore({data,error}) {
        if(data) {
            console.log('data in score: '+ data);
        }else if(error){
            console.log('error in score: '+ error);
        }
    }*/

    connectedCallback(){ 
        getScore({gameId : this.gameId})
        .then(result => {
            console.log('data in score: '+ result);
        })
        .catch(error => {
            console.log('error in score: '+ error);
        })
    
    
    }

}