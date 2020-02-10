import { BaseContext } from 'koa';
import { validate, ValidationError } from 'class-validator';
import Haikunator from 'haikunator';
import { request, summary, body, responsesAll, tagsAll } from 'koa-swagger-decorator';
import { Player, playerSchema } from '../entity/player';

/* import admin from 'firebase-admin';
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();
 */

import * as firebase from 'firebase-admin';
import { player } from '.';

firebase.initializeApp({
  credential: firebase.credential.applicationDefault(),
});


const db = firebase.firestore();


class UserRepository {
  public static async save(player: Player) {
    console.log(player.id);
    const playerRef = db.collection('users').doc(player.id);
    let data = {};
    const now = new Date().toLocaleString();
    return playerRef.get()
      .then(async snapshot => {
        if (snapshot.exists) {
          // Veteran has come...
          data = snapshot.data();
          const highScore = data['highScore'];
          if (!highScore || (highScore < player.id)) {
            data['highScore'] = player.highScore;
            data['highScoreDate'] = now;
          }
          await playerRef.update(data);
          const commitedPlayer: Player = new Player();
          commitedPlayer.id = player.id;
          commitedPlayer.name = player.name;
          commitedPlayer.highScore = data['highScore'];
          console.log('Update');
          console.log(commitedPlayer);
          console.log(data);
          return commitedPlayer;
        } else {
          // Here comes a new challenger!
          data = {
            name: player.name,
          };
          const commitedPlayer = await playerRef.set(data)
            .then(doc => {
              const commitedPlayer: Player = new Player();
              commitedPlayer.id = player.id;
              commitedPlayer.name = player.name;
              commitedPlayer.highScore = undefined;
              console.log('Create');
              console.log(commitedPlayer);
              return commitedPlayer;
            });
          return commitedPlayer;
        }
      });
  }

  /*   public static async listHighScorePlayers() {
      let players = [];
      const playerRef = await db.collection('users')
        .where('highScore', '>=', '0')
        .orderBy('highScore', 'desc')
        .offset(20)
        .get()
        .then(results => {
          results.forEach((doc) => {
            const p: Player = new Player();
            const data = doc.data();
            p.id = doc.id;
            p.name = data['name'];
            p.highScore = data['highScore'];
            players.push(p)
          });
        });
    } */
}



@responsesAll({ 200: { description: 'success' }, 400: { description: 'bad request' }, 401: { description: 'unauthorized, missing/wrong jwt token' } })
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
      const commited = await UserRepository.save(playerToBeSaved);
      console.log('Player Creation Success.');
      ctx.status = 201;
      ctx.body = commited;
    }
  }

  @request('put', '/players/{player_id}')
  @summary('Update a player')
  @body(playerSchema)
  public static async updatePlayer(ctx: BaseContext) {
    const playerToBeSaved: Player = new Player();
    playerToBeSaved.id = ctx.params.player_id;
    playerToBeSaved.name = ctx.request.body.name;
    playerToBeSaved.highScore = ctx.request.body.highScore || 0;
    console.log('PUT /players/:id');
    console.log(playerToBeSaved);
    const commited = await UserRepository.save(playerToBeSaved);
    ctx.status = 201;
    ctx.body = commited;
  }

  /*
    @request('get', '/players/')
    @summary('Get players')
    public static async listPlayers(ctx: BaseContext) {
      ctx.status = 200;
      ctx.body = { message: 'No Results' };
    } */
}
