import axios from 'axios';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const submitContactForm = functions.https.onCall(async data => {
  const { name, email, moduleName, url, lang, topic, message } = data;
  if (!name || !topic || !message || !email) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'One or more required arguments were not passed.'
    );
  }
  const body =
    `Someone submitted the contact form!\n\n` +
    `**URL**: ${url}\n` +
    `**Module**: ${moduleName ? moduleName : 'None'}\n` +
    `**Topic**: ${topic}\n` +
    `**Message**: \n${message}`;

  const key = functions.config().contactform.issueapikey;
  const githubAPI = axios.create({
    baseURL: 'https://api.github.com',
    auth: {
      username: 'maggieliu05',
      password: key,
    },
  });
  const labels = [];
  if (
    topic.includes('Typo') ||
    topic.includes('Missing Section') ||
    topic.includes('Unclear Explanation')
  )
    labels.push('content');
  if (topic.includes('Bug')) labels.push('bug');
  if (topic.includes('Website')) labels.push('website');
  if (topic.includes('Suggestion')) labels.push('enhancement');
  if (topic.includes('Missing Section')) labels.push('good first issue');
  let title = `Contact Form Submission - ${topic}`;
  if (moduleName) {
    title += ` (${moduleName})`;
  }
  const createdIssue = await githubAPI.post(
    '/repos/cpinitiative/usaco-guide/issues',
    {
      title: title,
      body: body,
      labels: labels,
    }
  );

  await admin.firestore().collection('contactFormSubmissions').add({
    name: name,
    email: email,
    moduleName: moduleName,
    url: url,
    lang: lang,
    topic: topic,
    message: message,
    issueNumber: createdIssue.data.number,
  });

  return createdIssue.data.html_url;
});
export default submitContactForm;
