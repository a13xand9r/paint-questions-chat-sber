import { SaluteResponse } from '@salutejs/scenario'

export const closeApp = (res: SaluteResponse) => {
    if (res.message.messageName === 'ANSWER_TO_USER')
        res.message.payload.items.push({ command: { type: 'close_app'} })
}