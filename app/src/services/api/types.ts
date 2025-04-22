export interface IApiResponse<T> {
    status: string
    data: T
    errors: IApiError[]
    meta: unknown
    message: string
}

interface IApiError {
    code: string
    field: string
    message: string
}