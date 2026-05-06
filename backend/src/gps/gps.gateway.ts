import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/gps' })
export class GpsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly clients = new Set<string>();

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    try {
      this.jwt.verify(token, { secret: process.env.JWT_SECRET });
      this.clients.add(client.id);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.clients.delete(client.id);
  }

  @SubscribeMessage('subscribe_live')
  handleSubscribe(client: Socket) {
    client.join('gps:live');
    return { event: 'subscribed', room: 'gps:live' };
  }

  broadcastPosition(ping: {
    driver_id: string;
    trip_id?: string;
    lat: number;
    lng: number;
    recorded_at: Date;
  }) {
    this.server.to('gps:live').emit('gps:update', ping);
  }
}
