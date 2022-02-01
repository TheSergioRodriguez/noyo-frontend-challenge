import { actions } from './redux-store';

const API_BASE = 'http://localhost:27606'

const USER_IDS_RETRY_DELAY_MS = 10000
const USER_IDS_NUMBER_OF_RETRY_ATTEMPTS = 4

let currentTimeout
let retryAttempts = 0

const retry = dispatch => {
  currentTimeout = setTimeout(() => {
    retryAttempts++

    if (retryAttempts > USER_IDS_NUMBER_OF_RETRY_ATTEMPTS) {
      resetRetry()
      return
    }

    dispatch(fetchUserIds())
  }, USER_IDS_RETRY_DELAY_MS)
}

const resetRetry = () => {
  clearTimeout(currentTimeout)
  currentTimeout = null
  retryAttempts = 0
}

const fetchUserIds = () => (dispatch) => {
  return fetch(`${API_BASE}/user_ids`).then((response) => {
    if (!response.ok) {
      if (response.code >= 500 && response.code <= 599) {
        retry(dispatch)
      } else {
        resetRetry()
      }
      return dispatch({
        type: actions.FETCH_USERS_ERROR,
      })
    }

    resetRetry()

    return response.json()
  }, err => {
    retry(dispatch)
    throw err
  }).then(data => {
    return dispatch({
      type: actions.FETCH_USERS_SUCCESS,
      payload: data
    })
  }, err => {
    return dispatch({
      type: actions.FETCH_USERS_ERROR
    })
  })
}

const fetchAddresses = (userId) => (dispatch) => {
  return fetch(`${API_BASE}/users/${userId}/addresses`).then((response) => {
    if (!response.ok) {
      return dispatch({
        type: actions.FETCH_ADDRESS_ERROR,
      })
    }

    return response.json()
  }, err => {
    throw err
  }).then(data => {
    return dispatch({
      type: actions.FETCH_ADDRESS_SUCCESS,
      payload: data
    })
  }, err => {
    return dispatch({
      type: actions.FETCH_ADDRESS_ERROR
    })
  })
}

const fetchEvents = (addressId) => (dispatch) => {
  return fetch(`${API_BASE}/addresses/${addressId}/events`).then((response) => {
    if (!response.ok) {
      return dispatch({
        type: actions.FETCH_EVENTS_ERROR,
      })
    }

    return response.json()
  }, err => {
    throw err
  }).then(data => {
    return dispatch({
      type: actions.FETCH_EVENTS_SUCCESS,
      payload: data
    })
  }, err => {
    return dispatch({
      type: actions.FETCH_EVENTS_ERROR
    })
  })
}

const fetchSelectedEventDetails = () => (dispatch, getState) => {
  const { selectedEvents, events } = getState()
  return Promise.all(
    events.filter(event => {
      return !!selectedEvents[event.created_at + '-' + event.id]
    }).map(event => {
      return fetch(API_BASE + event.url).then((response) => {
        if (!response.ok) {
          throw new Error('Failed request');
        }
        return response.json().then(json => ({ ...json, eventId: event.id }))
      }, err => {
        throw err
      })
    })
  ).then(values => {
    return dispatch({
      type: actions.EVENT_DETAILS_SUCCESS,
      payload: values
    })
  }).catch(err => {
    return dispatch({
      type: actions.EVENT_DETAILS_ERROR,
      payload: err
    })
  })
}

export { fetchUserIds, fetchAddresses, fetchEvents, fetchSelectedEventDetails }
