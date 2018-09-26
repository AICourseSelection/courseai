$(document).ready(function () {
    // Send query to Lex
    // This section of code only needs to be run once.
    AWS.config.region = 'eu-west-1'; // Region
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'eu-west-1:b204af0c-7b63-4a54-a23f-1d9ddfd72f6f',
    });
    let lexruntime = new AWS.LexRuntime();


    $('.msg_head').click(function () {
        $('.msg_wrap').slideToggle('slow');
        const msg_head = $('.msg_head');
        const collapsed_class = 'chatbox-collapsed';
        if (msg_head.hasClass(collapsed_class)) {
            msg_head.removeClass(collapsed_class);
        } else msg_head.addClass(collapsed_class);
    });

    // Close function, not used.
    /* $('.close').click(function () {
           $('.msg_box').hide();
       }); */

    const msg_input = $('.msg_input');
    autosize(msg_input);
    msg_input.keypress(function (e) {
        if (e.keyCode != 13) return;
        // When ENTER is pressed, add the message to the chat, and clear chatbox
        e.preventDefault();
        let msg = $(this).val();
        $(this).val('');
        if (!(/\S/.test(msg))) {
            console.log("String is whitespace");
            return;
        }
        $('<div class="msg_b">' + msg + '</div>').insertBefore('.msg_push');
        const body = $('.msg_body');
        body.scrollTop(body[0].scrollHeight);

        // This section needs to be there for every call
        let params = {
            botAlias: 'IntelligentSearch', /* Required */
            botName: 'IntelligentSearch', /* Required */
            contentType: 'text/plain; charset=utf-8', /* required */
            inputStream: msg, /* Required. Replace this with the actual question that is asked. */
            userId: 'tom', /* Required */
            accept: 'text/plain; charset=utf-8',
            requestAttributes: {} /* This value will be JSON encoded on your behalf with JSON.stringify() */,
            sessionAttributes: {} /* This value will be JSON encoded on your behalf with JSON.stringify() */
        };

        // Create the new text bubble
        const reply_bubble = $('<div class="msg_a temp">&hellip;</div>');
        reply_bubble.insertBefore('.msg_push');

        lexruntime.postContent(params, function (err, data) {
            if (err) console.log(err, err.stack);   // an error occurred
            else {
                console.log(data.message);      // successful response
                answer = data.message;

                reply_bubble.removeClass('temp');
                reply_bubble.text(answer);      // Put the answer in the bubble
                const body = $('.msg_body');
                body.scrollTop(body[0].scrollHeight);
            }
        });
    });
});