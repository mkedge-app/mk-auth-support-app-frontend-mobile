import axios from 'axios';

const resources = {};

const makeRequestCreator = () => {
  let cancel;

  return async (query, authorization) => {
    if (cancel) {
      // Cancel the previous request before making a new request
      cancel.cancel();
    }
    // Create a new CancelToken
    cancel = axios.CancelToken.source();

    try {
      if (resources[query]) {
        // Return result if it exists
        return resources[query];
      }
      const res = await axios.get(query, authorization, {
        cancelToken: cancel.token,
      });

      const result = res.data;
      // Store response
      resources[query] = result;

      return result;
    } catch (error) {
      if (axios.isCancel(error)) {
        // Handle if request was cancelled
        console.log('Request canceled', error.message);
      } else {
        // Handle usual errors
        console.log('Something went wrong: ', error.message);
      }
    }
  };
};

export const searchUtil = makeRequestCreator();
