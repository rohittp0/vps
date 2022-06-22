import Model, {baseUrl, filePost, ModelData,  ModelObject} from "./api";
import {getAuth} from "./auth";


export class ExampleObject extends ModelObject 
{

    constructor(data: ModelData, baseUrl: string) 
    {

        super(data, baseUrl);
        this.fields = ["id"];
        this.getData();

    }

    async addPhoto(file: File)
    {
        const formData = new FormData();

        formData.append("image", file, file.name);
        formData.append("id", this.id.toString());
        const headers = {"Authorization": `Bearer ${getAuth()}`};

        return await filePost(baseUrl + "/api/image/", formData, headers);
    }
}

export const Example = new Model(baseUrl + "/api/marker/", ExampleObject);

export type ModelRegistry = typeof ExampleObject;

