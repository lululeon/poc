import { TodoType } from './Schema'


// helper filters out the item(s) to be removed
const remove = (itemArray:TodoType[], itemId:string) =>
  itemArray.filter(cur => cur.id !== itemId)

// helper adds the item at the end of the existing list
const create = (itemArray:TodoType[], item: TodoType) => {
  return [
    item,
    ...itemArray,
  ]
}

// helper
const update = (
  itemArray:TodoType[],
  itemId: string,
  data: any,
) => {
  const initArray: TodoType[] = []
  return itemArray.reduce((prev, cur) => {
    // destructure the received update patch to separate away the id (which we wld never update)
    const { id, ...rest } = data
    if (cur.id === itemId) {
      // found the one to update: update and add to the list of items to be written to state
      prev.push({ ...cur, ...rest })
    } else {
      // no update: just pass thru to list of items to be written to state
      prev.push(cur)
    }
    return prev
  }, initArray) // the first 'prev' item is an empty array. That should help u reason abt what's going on here.
}


export default {
  create,
  update,
  remove,
}
