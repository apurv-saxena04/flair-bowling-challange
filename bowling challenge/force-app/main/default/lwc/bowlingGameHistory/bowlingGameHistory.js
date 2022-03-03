import { LightningElement, track, wire } from 'lwc';
import getGames from '@salesforce/apex/BowlingScoreCalculator.getGames';
import { NavigationMixin } from 'lightning/navigation';

export default class BowlingGameHistory extends NavigationMixin(LightningElement) {


    @track columns = [
        { label: 'Name', fieldName: 'recId', type: 'url', typeAttributes: {label: {fieldName: 'Name'}, type: 'text', WrapText: true, target: '_blank'}},
        { label: 'Number of players', fieldName: 'Number_of_players__c'},
        { label: 'Created Date', fieldName: 'CreatedDate', type: 'date', typeAttributes: {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }}
    ];

    @track gameList;

    @wire(getGames)
    wiredGames({data,error}){
        if(data){
            console.log('data'+JSON.stringify(data));
            let tempData = JSON.parse(JSON.stringify(data));
            tempData.forEach(element => {
                element.recId = '/'+element.Id;
            });
            this.gameList = tempData;
            
        }else if(error){
            console.log('error > '+error);
        }
    }
}