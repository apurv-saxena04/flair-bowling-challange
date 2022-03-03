import { LightningElement,api } from 'lwc';

export default class BowlingGameContainer extends LightningElement {

    @api showGameScreen = false;
    @api gameId;

    handleGameStart(event){
        console.log('Inside handleGameStart');
        this.gameId = event.detail.gameid;
        console.log('game id '+ this.gameId);
        this.showGameScreen = true;
    }
}