sap.ui.define([], function() {
    "use strict";
    return {
// All your formatted functions like below
/**
* Returns Timestamp 
 * @public
 * @param {string} sValue the number string to be timestamp formatted
* @returns {string} sValue in DD-MM-YYYY: HH:MM:SS
*/
    stringDate: function(sValue) {
                if (!sValue) {
                    return "";
                }               
                return (sValue[6] + sValue[7] + '/' +  sValue[4] + sValue[5]  + '/' + sValue[0] + sValue[1] + sValue[2] + sValue[3]);               
               
            },
    timeDate: function(sValue) {
                if (!sValue) {
                    return "";
                }
                var date = sValue.getDate().toString().padStart(2, '0');
                var month = sValue.getMonth() + 1;
                month = month.toString().padStart(2, '0');
                return (date + "/" + month + "/" + sValue.getFullYear());
                                      
            },
    statusIcon: function (sValue){
        switch (sValue) {
            case "V": return ("sap-icon://sys-enter-2");
                        break;
            case "R": return ("sap-icon://error");
                        break;
            case "A": return ("sap-icon://alert");
                        break;
        }
        
    },
    statusColor: function (sValue){
        switch (sValue) {
            case "V": return ("Success");
                        break;
            case "R": return ("Error");
                        break;
            case "A": return ("Warning");
                        break;
        }
        
    },
    removeZeros: function (sValue){
        if (sValue)
            return (parseFloat(sValue))        
    },
    replaceZeros: function (sValue){
        if (sValue)
            return (sValue.replace(".000",",00"));       
    },
    stringBloq: function (sValue){
        if (sValue == "X")
            return ("Bloqueado")
        else    
            return ("Desbloqueado")        
    }
       
    };
});