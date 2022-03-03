import { LightningElement, api } from 'lwc';
import getPlayers from '@salesforce/apex/BowlingScoreCalculator.getPlayers';
import updatePlayerScore from '@salesforce/apex/BowlingScoreCalculator.updatePlayerScore';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class F_gameScreen extends LightningElement {
    @api gameId;
    @api playerList = [];
    @api orignalPlayerList = [];
    @api wrapFrameToScoreList = [];
    playerScoreByFrames = [];
    playerScoreList = []; 
    round1Score = 0;   
    @api resultList = [];

    connectedCallback(){ 
        let scoreByframes1 = [0,0,0,0,0,0,0,0,0,0];
        let frames = [1,2,3,4,5,6,7,8,9,10];
        let tenthFrame = false;

        getPlayers({gameId : this.gameId})
        .then(result => {
            this.playerList = [];
            var tempList = JSON.parse(JSON.stringify(result));
            console.log('####tempList -->'+JSON.stringify(tempList));
            for(var x= 1; x<11; x++){
                if(x<=9){
                    this.wrapFrameToScoreList.push({frame:x, score: scoreByframes1[x-1]});
                }else if(x==10){
                    this.wrapFrameToScoreList.push({frame:x, score: scoreByframes1[x-1], tenthFrame: true});
                }
            }

            for(var i = 0; i<tempList.length; i++){
                this.playerList.push({rec: tempList[i], disabled: false, wrap: this.wrapFrameToScoreList});
            }

            this.orignalPlayerList = this.playerList;
            this.resultList = tempList;
        })
        .catch(error => {
            console.log('!!!!!!error : '+error);
        }).finally(() => {
            this.playerList.forEach(player => {
                this.handleDisablePlayerInputs(player.rec.Id, 1, 1, true, false);
            });        
        });   
    }

    //Method to display toast messages
    displayToast(typeStr, messageStr, titleStr){
        const event = new ShowToastEvent({
            title: titleStr,
            message: messageStr,
            variant: typeStr,
            mode: 'dismissable'
        });

        this.dispatchEvent(event);        

    }

    //Method which is called every time user inputs a score and presses Enter key
    handleScoreInputByUser(event){
        let isStrike = false;
        let value = parseInt(event.target.value);
        let playerRecId = event.currentTarget.dataset.id;
        let currentFrame = parseInt(event.currentTarget.dataset.frame);
        let currentRound = parseInt(event.currentTarget.dataset.round);
        let playerIndex = this.playerList.findIndex(x => x.rec.Id == playerRecId);
        let scoreArray = [];
        let flag = false;

        if(!value && value !== 0){
            if(event.keyCode === 13){
                console.log('inside null value');
                this.displayToast('error', 'Please enter a score', 'Error');
            }
        }else if(value>10){
            if(event.keyCode === 13){
                console.log('inside max value');
                this.displayToast('error', 'Maximum score should not be more than 10', 'Error');
            }
            
        }
        else{
            if(event.keyCode === 13){
                console.log('##### enter is pressed and value--> '+event.target.value);
                console.log('##### playerRecId--> '+playerRecId);
                console.log('##### round : '+currentRound);
                console.log('##### frame : '+currentFrame);
                if(currentRound == 1 && currentFrame==1){
                    scoreArray = [];
                }           
                this.playerScoreList.forEach(player => {
                    if(player.playerId == playerRecId){
                        player.score.push(value);
                        flag=true;
                    }
                });
    
                if(!flag){
                    this.playerScoreList.push({playerId : playerRecId, score : [value]});
                }
                
                if(value == 10){
                    isStrike = true;
                }
                scoreArray = [];
                this.handleDisablePlayerInputs(playerRecId, currentFrame, currentRound, false, isStrike);            
            }       
            console.log('##### this.playerScoreList : '+JSON.stringify(this.playerScoreList));              
            if(currentFrame==10 && playerIndex==this.playerList.length-1 && currentRound ==3){ 
                if(event.keyCode === 13){
                    console.log('playerScoreList>>>>'+JSON.stringify(this.playerScoreList));
                    this.wrapFrameToScoreList = [];
                    this.playerScoreList.forEach(playerscore => {
                        let score = this.calculateGameScore(playerscore.playerId,playerscore.score);
                        console.log('####player score Id--> '+playerscore.playerId+' ##### score--> '+score);
                        console.log('after score calcucation>>scorebyframe '+JSON.stringify(this.playerScoreByFrames));

                        var scoresByFrameObj = this.playerScoreByFrames.find(playerScoreByFrame => playerScoreByFrame.playerId === playerscore.playerId);
                        for(var x= 1; x<11; x++){
                            if(x<=9){
                                this.wrapFrameToScoreList.push({playerId:scoresByFrameObj.playerId , frame:x, score: scoresByFrameObj.scorebyFrame[x-1], tenthFrame: false});
                            }else if(x==10){
                                this.wrapFrameToScoreList.push({playerId:scoresByFrameObj.playerId, frame:x, score: scoresByFrameObj.scorebyFrame[x-1], tenthFrame: true});
                            }
                        }
                    });
                    

                    this.playerList =[];
                    var finalPayload = [];
                    let startingIndex = 0;
                    let endingIndex = 10; 
                    for(var i = 0; i<this.resultList.length; i++){
                        var wrapFrameScoreObj = this.wrapFrameToScoreList.find(player1 => player1.playerId == this.resultList[i].Id); 
                        console.log('before pushing into player list wrapFrameScoreObj>>>'+JSON.stringify(wrapFrameScoreObj));
                        var finalScoreObj = this.playerScoreByFrames.find(player2 => player2.playerId == this.resultList[i].Id);                             
                        if(i>0){
                            startingIndex = startingIndex + 10;
                            endingIndex = endingIndex +10;
                        }
                        this.playerList.push({rec: this.resultList[i], wrap:this.wrapFrameToScoreList.slice(startingIndex,endingIndex), finalScore: finalScoreObj.finalScore});
                        finalPayload.push({playerId: this.resultList[i].Id, score: finalScoreObj.finalScore});
                    }
                    console.log('>>>finalPayload>>'+JSON.stringify(finalPayload));

                    //Calling Apex method to update score in Salesforce objects
                    updatePlayerScore({payload: JSON.stringify(finalPayload)})
                        .then(result => {
                            console.log('result after updating ->'+ result);
                        }).catch(error => {
                            console.log('error after updating ->'+ error);
                        }) 
                    console.log('final playerList'+JSON.stringify(this.playerList));
                    
                }
            }
        }
         
    }

    //Method to enable/disable input boxes
    handleDisablePlayerInputs(playerId, frame, round, onload, isStrike){
        console.log('##### inside handleDisablePlayerInputs : '+playerId+' : '+frame+' : '+round);
        let playerIndex = this.playerList.findIndex(x => x.rec.Id == playerId);
        let playerInputs = this.template.querySelectorAll('lightning-input[data-id='+playerId+']');
        if(onload){
            if(frame==1 && round==1 && playerIndex==0){  
                console.log('#####playerIndex : '+playerIndex);          
                playerInputs.forEach(input => {
                    if(input.dataset.frame==1 && input.dataset.round==1){
                        input.disabled = false;
                        input.focus();
                    }else{
                        input.disabled = true;
                    }
                });
            }else{            
                console.log('#####playerIndex not first : '+playerIndex);
                if(round==2){
    
                }
                playerInputs.forEach(input => {
                    input.disabled = true;
                });
            }
        }else{
            console.log('#####offload : '+playerIndex);
            let nextPlayerInputs = [];
            let firstPlayerInputs = [];
            if(round==2 && playerIndex<this.playerList.length-1 && frame != 10){
                console.log('#####round2 & playerIndex less than size : '+playerIndex);
                nextPlayerInputs = this.template.querySelectorAll('lightning-input[data-id='+this.playerList[playerIndex+1].rec.Id+']');
            }
            else if(frame!=10 && round==2 && playerIndex==this.playerList.length-1){
                console.log('#####round2 & frame not 10 &playerIndex greater than size : '+playerIndex);
                firstPlayerInputs = this.template.querySelectorAll('lightning-input[data-id='+this.playerList[0].rec.Id+']');
            }
            if(round==2 && frame!=10){ 
                console.log('#####round2 : '+playerIndex);
                if(nextPlayerInputs){
                    console.log('##### nextPlayerInputs found : ');
                    playerInputs.forEach(inp => {
                        if(inp.dataset.frame==frame && inp.dataset.round==round){
                            inp.disabled = true;
                        }
                    });
                    nextPlayerInputs.forEach(nxtinp => {
                        if(nxtinp.dataset.frame==frame && nxtinp.dataset.round==(round-1)){
                            nxtinp.disabled = false;
                            nxtinp.focus();
                        }
                    });                    
                }
                if(firstPlayerInputs){
                    console.log('##### nextPlayerInputs found : ');
                    playerInputs.forEach(inp => {
                        if(inp.dataset.frame==frame && inp.dataset.round==round){
                            inp.disabled = true;
                        }
                    });
                    firstPlayerInputs.forEach(firstinp => {
                        if(firstinp.dataset.frame==(frame+1) && firstinp.dataset.round==(round-1)){
                            firstinp.disabled = false;
                            firstinp.focus();
                        }
                    });
                }
            }else{
                let nextPlayerInputs = [];  
                let firstPlayerInputs = [];

                if(isStrike){
                    console.log('##### strike : '+isStrike);
                    console.log();
                    nextPlayerInputs = [];  
                    firstPlayerInputs = [];
                    if(playerIndex<this.playerList.length-1){
                        console.log('#####strike & playerIndex less than size : '+playerIndex);
                        nextPlayerInputs = this.template.querySelectorAll('lightning-input[data-id='+this.playerList[playerIndex+1].rec.Id+']');
                    }
                    else if(frame!=10 && playerIndex==this.playerList.length-1){
                        console.log('#####strike & frame not 10 &playerIndex equal to size : '+playerIndex);
                        firstPlayerInputs = this.template.querySelectorAll('lightning-input[data-id='+this.playerList[0].rec.Id+']');
                    }  
                    if(JSON.stringify(nextPlayerInputs) != '[]'){
                        console.log('##### nextPlayerInputs found : ');
                        playerInputs.forEach(inp => {
                            if(inp.dataset.frame==frame && inp.dataset.round==round){
                                inp.disabled = true;
                            }
                        });
                        nextPlayerInputs.forEach(nxtinp => {
                            if(nxtinp.dataset.frame==frame && nxtinp.dataset.round==round){
                                nxtinp.disabled = false;
                                nxtinp.focus();
                            }
                        });                    
                    }
                    if(JSON.stringify(firstPlayerInputs) != '[]'){
                        console.log('##### firstPlayerInputs found : ');
                        playerInputs.forEach(inp => {
                            if(inp.dataset.frame==frame && inp.dataset.round==round){
                                inp.disabled = true;
                            }
                        });
                        firstPlayerInputs.forEach(firstinp => {
                            if(firstinp.dataset.frame==(frame+1) && firstinp.dataset.round==round){
                                firstinp.disabled = false;
                                firstinp.focus();
                            }
                        });
                    }        
                }
                else{
                    playerInputs.forEach(inp => {
                        if(inp.dataset.frame==frame && inp.dataset.round==round){
                            inp.disabled = true;
                        }
                        else if(inp.dataset.frame==frame && inp.dataset.round==(round+1)){
                            inp.disabled = false;
                            inp.focus();
                        }
                    });
                }
                if(frame==10){
                    console.log('In Last FRAME >>>>>>');
                    if(playerIndex<this.playerList.length-1){
                        if(round == 1 || round == 2){
                            playerInputs.forEach(inp => {
                                if(inp.dataset.frame==frame && inp.dataset.round==round){
                                    inp.disabled = true;
                                }
                                else if(inp.dataset.frame==frame && inp.dataset.round==(round+1)){
                                    inp.disabled = false;
                                    inp.focus();
                                }
                            });
                        }else if(round == 3){
                            nextPlayerInputs = this.template.querySelectorAll('lightning-input[data-id='+this.playerList[playerIndex+1].rec.Id+']');
                            if(JSON.stringify(nextPlayerInputs) != '[]'){
                                console.log('##### nextPlayerInputs found : ');
                                playerInputs.forEach(inp => {
                                    if(inp.dataset.frame==frame && inp.dataset.round==round){
                                        inp.disabled = true;
                                    }
                                });
                                nextPlayerInputs.forEach(nxtinp => {
                                    if(nxtinp.dataset.frame==frame && nxtinp.dataset.round==1){
                                        nxtinp.disabled = false;
                                        nxtinp.focus();
                                    }
                                });                    
                            }
                        }
                    }else if(playerIndex == this.playerList.length-1){
                        if(round == 1 || round ==2){
                            playerInputs.forEach(inp => {
                                if(inp.dataset.frame==frame && inp.dataset.round==round){
                                    inp.disabled = true;
                                }
                                else if(inp.dataset.frame==frame && inp.dataset.round==(round+1)){
                                    inp.disabled = false;
                                    inp.focus();
                                }
                            });
                        }
                    }
                }  
            } 
                     
        }
        
    }

    //Method to perform score logic
    calculateGameScore(playerId, scoreArray){
        let game = scoreArray;
        let frameCount = 0;
        let score = 0;
        let scoreByFrames = [];
        var i = 0;
        console.log('##### called calculateGameScore');


        do {
            // see if we're at the last roll
            if (this.gameOver(frameCount)) {
                break;
            }

            var frameScore = 0;
            var roll1 = game[i];

            // tally score for a strike
            if (roll1 == 10) {
                frameScore = 10 + game[i+1] + game[i+2];
            } else {                    
                // find out how many pins the second roll knocked down
                var roll2 = game[++i];

                // tally score for spare or sum the two rolls
                if ((roll1 + roll2) == 10) {
                frameScore = 10 + game[i+1];
                } else {
                frameScore =  roll1 + roll2;
                }
            }      
            score += frameScore;
            
            scoreByFrames.push(score);
            frameCount++;
            i++;

        } while (i < game.length);
        console.log('##### score final--> '+score);
        this.playerScoreByFrames.push({playerId: playerId, scorebyFrame: scoreByFrames, finalScore: score});
        return score; //playerId, scoreByFrame, score
    }
    
    gameOver(frameCount){
        // frame count starts at 0 so 10 is really the eleventh frame (in other words the game is over)
    return frameCount == 10;
    }
        
}