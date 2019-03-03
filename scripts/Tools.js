module.exports = {
    verifyAuth: (chat) => {
        return new Promise((resolve, reject) => {
            chat.getChatMember(chat.from.id).then(user => {
                if (user.status == 'creator' || user.status == 'administrator') {
                    resolve(true);
                }
                resolve(false);
            });
        });
    }
}