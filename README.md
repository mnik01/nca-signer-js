# NCA Signer JS

## Как это работает?

[NCALayer](https://ncl.pki.gov.kz/) должен быть установлен и запущен на клиентском устройстве. NCALayer поднимает локальное web sockets соединение на которое клиентская часть веб-сайта (фронт-енд) посылает сообщения для подписи файлов. ЭЦП ключи при этом не покидают устройство клиента, как того требует TODO (ссылка на требование).

Скачанный после подписи файл содержит информацию о подписанте.

- Скрипт доступен через CDN: https://cdn.jsdelivr.net/gh/mnik01/nca-signer-js@latest/signer.js
- Подпись может быть проверена и извлечена на сайте https://ezsigner.kz/#!/main

Документация и доп. ресурсы:
- todo

## Пример использования

```html
<!-- Более детальный пример смотрите в папке examples -->
<script src="https://cdn.jsdelivr.net/gh/mnik01/nca-signer-js@0.0.2-alpha/signer.js"></script>

<input type="file" id="fileInput" />
<button id="submit">Подписать файл</button>

<script>
  NCASigner.connect()
  NCASigner.linkFileInput({ id: "fileInput" });

  document.querySelector("#submit").addEventListener('click', async () => {
    let signedData = await NCASigner.signFile();
    NCASigner.downloadCMSFile(signedData);
  });
</script>
```

## Требования

Протестировано на NCALayer версии 1.4

## Запуск тестов

todo
