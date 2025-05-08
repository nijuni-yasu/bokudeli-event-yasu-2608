import { format } from 'date-fns'

export const convertToDate = (millis: number) => format(millis, 'yyyy/MM/dd')
