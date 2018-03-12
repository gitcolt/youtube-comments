$(function() {

    class Comment {
        constructor(id, author, text, replies) {
            this.id = id;
            this.author = author;
            this.text = text;
            this.replies = replies;
        }
    }

    function getReplies(parentId) {
        return $.get(
            'https://www.googleapis.com/youtube/v3/comments', {
                part: 'snippet',
                parentId: parentId,
                key: 'AIzaSyAPnPO5BHR0VGOx87eLdWtmktduh9wSrIc' },
        ).then(function(result) {
            return result;
        });
    }

    function getTopLevelComments(videoId, pageToken) {
        return $.get(
            'https://www.googleapis.com/youtube/v3/commentThreads', {
                part: 'id,snippet',
                //videoId: 'm4Jtj2lCMAA',
                videoId: videoId,
                pageToken: pageToken,
                key: 'AIzaSyAPnPO5BHR0VGOx87eLdWtmktduh9wSrIc' },
        ).then(function(result) {
            app.nextPageToken = result.nextPageToken;
            return result.items;
        });
    }

    function fetchComments(url, pageToken) {
        // delete this
        if (url === '') {
            url = 'https://www.youtube.com/watch?v=rwOI1biZeD8';
        }
        let i = url.indexOf('=') + 1;
        let videoId = url.slice(i);
        let comments = [];

        getTopLevelComments(videoId, pageToken)
        .then(function(response) {
            $.each(response, function(i, comment) {
                let topLevelText = comment.snippet.topLevelComment.snippet.textDisplay;
                let topLevelCommentId = comment.id;
                let topLevelAuthor = comment.snippet.topLevelComment.snippet.authorDisplayName;
                let c = new Comment(topLevelCommentId, topLevelAuthor, topLevelText, []);
                comments.push(c);
            });
            return comments; 
        }).then(function(comments) {
            return Promise.all(
                $.map(comments, function(comment) {
                    return getReplies(comment.id); 
                })
            );
        }).then(function(repliesLists) {
            $.each(repliesLists, function(repliesIdx, repliesList) {
                if (repliesList.items.length > 0) {
                    $.each(repliesList.items, function(i, reply) {
                        let replyText = reply.snippet.textDisplay;
                        let replyAuthor = reply.snippet.authorDisplayName;
                        let c = new Comment(null, replyAuthor, replyText, []);
                        comments[repliesIdx].replies.push(c);

                    });
                    comments[repliesIdx].replies.reverse();
                }
            });

            for (let i = 0; i < comments.length; i++) {
                app.comments.push(comments[i]);
            }
        })
        .then(function() {
            if (app.nextPageToken) {
                fetchComments(app.url, app.nextPageToken);
            }
        });
    }

    let app = new Vue({
        el: '#app',
        data: {
            url: '',
            comments: [],
            nextPageToken: null
        },
        methods: {
            onEnter: function() {
                fetchComments(this.url)
            }
        },
        filters: {
            unescape(text) {
                let doc = new DOMParser().parseFromString(text, 'text/html');
                return doc.documentElement.textConent;
            }
        }
    });

    // Autofocus
    app.$refs.input.focus();

    gapi.load('client', start);

    function start() {
        gapi.client.init({
            'apiKey': 'AIzaSyAPnPO5BHR0VGOx87eLdWtmktduh9wSrIc'
        }).then(function() {
            console.log('success?');
        });
    };

});
