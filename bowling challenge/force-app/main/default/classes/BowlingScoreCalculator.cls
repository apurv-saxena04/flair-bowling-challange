public class BowlingScoreCalculator {
    @AuraEnabled
    public static string createGameAndPlayerRecords(String gameName, String payload){
        system.debug('payload : '+payload);
        List<Players__c> playerList = new List<Players__c>();
        
        Game__c game = new Game__c();
        game.name = gameName;
        insert game;

        List<playerWrapper> playerWrapperList = (List<playerWrapper>)JSON.deserialize(payload,List<playerWrapper>.class);
        for(playerWrapper player : playerWrapperList){
            Players__c players = new Players__c();
            players.name = player.value;
            players.Game__c = game.Id;
            playerList.add(players);
        }

        if(playerList.size() > 0){
            insert playerList;
        }
        
        return game.id;

    }
    
    @AuraEnabled(cacheable=true)
    public static List<Game__c> getGames(){
        return [SELECT id,Name,Number_of_players__c,CreatedDate FROM Game__c LIMIT 10];
    }

    @AuraEnabled(cacheable=true)
    public static List<Players__c> getPlayers(String gameId){
        List<Players__c> playersList = new List<Players__c>();
        playersList = [SELECT id,name,Score__c,Game__c FROM Players__c where Game__c =: gameId];
        if(playersList.size()>0){
            return playersList;
        }
        return null;
    }

    @AuraEnabled
    public static Boolean updatePlayerScore(String payload){
        System.debug('Inside updatePlayerScore>>>'+payload);
        try{
            List<Players__c> playerListToUpdate = new List<Players__c>();
            List<playerFinalScoreWrapper> playerFinalPayload = (List<playerFinalScoreWrapper>)JSON.deserialize(payload,List<playerFinalScoreWrapper>.class);
            System.debug('playerFinalPayload>>>'+playerFinalPayload.size());
            for(playerFinalScoreWrapper finalPayload : playerFinalPayload){
                Players__c player = new Players__c();
                player.Id = finalPayload.playerId;
                System.debug('finalPayload.playerId>>>'+finalPayload.playerId);
                player.Score__c = finalPayload.score;
                System.debug('finalPayload.score>>>'+finalPayload.score);
                playerListToUpdate.add(player);
            }
            if(playerListToUpdate.size()>0){
                system.debug('before update>>>');
                update playerListToUpdate;
                return true;
            }
            return null;
        }catch(Exception ex){
            system.debug('Error : '+ ex.getMessage());
            return false;
        }
        
    }

    public class playerWrapper {

        @AuraEnabled public string name{get; set;}
        @AuraEnabled public string value{get; set;}
    
   }

   public class playerFinalScoreWrapper {
    @AuraEnabled public string playerId{get; set;}
    @AuraEnabled public Integer score{get; set;}
   }

}