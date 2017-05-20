/**
 * Created by Luca on 31.01.2017.
 */

module.exports = {
    uniqueId : function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4();
    }
}