import { ReducerKeys } from './reducers'
import store from './store'

export const dispatch = store.dispatch
export const getState = store.getState

export function cleanAction(reducer: ReducerKeys) {
  dispatch({ type: 'clean_' + reducer })
}

export function setAction<K extends ReducerKeys>(
  reducer: K,
  data: Partial<ReturnType<typeof getState>[K]>,
) {
  dispatch({ payload: data, type: 'set_' + reducer })
}
