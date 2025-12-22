import { Module, Global } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Global()
@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (config: ConfigService) => ({
                transport: {
                    host: config.get('MAIL_HOST'),
                    port: config.get('MAIL_PORT'),
                    secure: config.get('MAIL_PORT') === 465,
                    auth: {
                        user: config.get('MAIL_USER'),
                        pass: config.get('MAIL_PASS'),
                    },
                },
                defaults: {
                    from: `"No Reply" <${config.get('MAIL_FROM')}>`,
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule { }
