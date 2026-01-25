export const toggleLike = (likes, userId) => {
    const index = likes.findIndex(
        (id) => id.toString() === userId.toString()
    )

    if(index === -1 ){
        likes.push(userId);
        return true // like
    }

    likes.splice(index, 1);

    return false // unlike
}