import { BaseContext } from 'koa';
import { validate, ValidationError } from 'class-validator';
import Haikunator from 'haikunator';
import { request, summary, body, responsesAll, tagsAll } from 'koa-swagger-decorator';
import { Player, playerSchema } from '../entity/player';

@responsesAll({ 200: { description: 'success'}, 400: { description: 'bad request'}, 401: { description: 'unauthorized, missing/wrong jwt token'}})
@tagsAll(['Player'])
export default class PlayerController {
  @request('post', '/players')
  @summary('Create a player')
  @body(playerSchema)
  public static async createPlayer(ctx: BaseContext) {
    // get a user repository to perform operations with user
    // const userRepository: Repository<User> = getManager().getRepository(User);

    // build up entity user to be saved
    console.log(ctx.request.body);
    const playerToBeSaved: Player = new Player();
    playerToBeSaved.name = ctx.request.body.name;

    // validate user entity
    const errors: ValidationError[] = await validate(playerToBeSaved); // errors is an array of validation errors

    if (errors.length > 0) {
      // return BAD REQUEST status code and errors array
      ctx.status = 400;
      ctx.body = errors;
    } else {
      const randomString = (choices: string, len: number): string => {
        const cl: number = choices.length;
        let result = '';
        for (let i = 0; i < len; i++) {
          result += choices[Math.floor(Math.random() * cl)];
        }
        return result;
      };

      const haikunator = new Haikunator();
      const rand = randomString('0123456789', 6);
      playerToBeSaved.id = rand;
      playerToBeSaved.name = haikunator.haikunate();
      // save the user contained in the POST body
      // const user = await userRepository.save(userToBeSaved);
      // return CREATED status code and updated user
      ctx.status = 201;
      ctx.body = playerToBeSaved;
    }
  }
}

