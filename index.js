const AWS = require('aws-sdk');
const uuid = require('uuid');
const request = require('superagent');
const fs = require('fs');

const transcribe = new AWS.TranscribeService();

{
// Create Transcription Job
    const params = {
        LanguageCode: 'en-US',
        Media: {
            // MediaFileUri: 'https://s3.amazonaws.com/com.ryanburgett.personal/transcription_test.mp3'
            MediaFileUri: 'https://s3.amazonaws.com/technoagorist.com/audio/ta_0006.mp3'
        },
        MediaFormat: 'mp3',
        TranscriptionJobName: 'test-' + uuid.v4()
    };

    transcribe.startTranscriptionJob(params, (err, data) => {
        if(err) {
            console.error(err);
        } else {

            const start = new Date().getTime();

            const { TranscriptionJobName } = data.TranscriptionJob;

            const interval= setInterval(() => {

                transcribe.getTranscriptionJob({ TranscriptionJobName }, async function(err1, data1) {
                    try {
                        if(err1) {
                            console.error(err1);
                        } else {
                            const { TranscriptionJob: transcription } = data1;
                            if(transcription.TranscriptionJobStatus === 'COMPLETED') {
                                const end = new Date().getTime();
                                console.log('Finished in ' + ((end - start) / 60000).toFixed(1) + ' minutes.');
                                clearInterval(interval);
                                const { TranscriptFileUri } = transcription.Transcript;
                                const res = await request.get(TranscriptFileUri).responseType('blob');
                                const json = res.body.toString('utf8');
                                const parsed = JSON.parse(json);
                                // console.log(parsed.results.transcripts);
                                const text = parsed.results.transcripts.map(t => t.transcript).join('\n\n');
                                fs.writeFileSync('result.txt', text, 'utf8');
                            }
                        }
                    } catch(err2) {
                        console.error(err2);
                    }
                });
            }, 30000);
        }
    });
}
