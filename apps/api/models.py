from django.db import models

class Parameters(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name="Nombre")
    value = models.TextField(verbose_name="Valor")
    description = models.CharField(max_length=255, blank=True, null=True, verbose_name="Descripcion")

    class Meta:
        verbose_name = "parametro"
        verbose_name_plural = "parametros"

    def __str__(self):
        return f"{self.name} | Descripcion: {self.description} "

class PackageTypes(models.Model):
    name = models.CharField(max_length=50, verbose_name="Nombre")
    abbreviation = models.CharField(max_length=5, verbose_name="Abreviatura")

    class Meta:
        verbose_name = "tipo de paquete"
        verbose_name_plural = "tipos de paquetes"

    def __str__(self):
        return f"{self.name} - {self.abbreviation}"

class PackagePrices(models.Model):
    name = models.CharField(max_length=50, verbose_name="Nombre")
    mount = models.PositiveIntegerField(verbose_name="Monto")
    abbreviation = models.CharField(max_length=255, verbose_name="Abreviatura")

    class Meta:
        verbose_name = "monto de paquete"
        verbose_name_plural = "montos de paquetes"

    def __str__(self):
        return f"{self.name} - {self.mount} - {self.abbreviation}"

class PaymentsTypes(models.Model):
    name = models.CharField(max_length=50, verbose_name="Nombre")
    abbreviation = models.CharField(max_length=5, verbose_name="Abreviatura")

    class Meta:
        verbose_name = "tipo de pago"
        verbose_name_plural = "tipos de pagos"

    def __str__(self):
        return self.name

class StatesList(models.Model):
    name = models.CharField(max_length=50, verbose_name="Nombre")
    abbreviation = models.CharField(max_length=5, verbose_name="Abreviatura")

    class Meta:
        verbose_name = "estado"
        verbose_name_plural = "estados"

    def __str__(self):
        return f"{self.name} - {self.abbreviation}"

class Shipments(models.Model):
    package_type = models.ForeignKey('PackageTypes', on_delete=models.CASCADE, verbose_name="Tipo de paquete")
    tracking_number = models.CharField(max_length=11, primary_key=True, editable=False, verbose_name="Número de seguimiento")
    creation_date = models.DateTimeField(auto_now_add=True, editable=False, verbose_name="Fecha de creacion")
    update_date = models.DateTimeField(auto_now=True, verbose_name="Fecha de actualizacion")
    status = models.ForeignKey(StatesList, on_delete=models.CASCADE, default=1, verbose_name="Estado")
    sender = models.CharField(max_length=50, verbose_name="Remitente")
    recipient = models.CharField(max_length=50, verbose_name="Destinatario")
    phone = models.CharField(max_length=10, verbose_name="Telefono")
    package_amount = models.ForeignKey('PackagePrices', on_delete=models.CASCADE, verbose_name="Importe de paquete")
    envelope_amount = models.PositiveIntegerField(default=0, verbose_name="Importe de sobre")
    package_pickup = models.BooleanField(verbose_name="Recogida de paquete")
    total_amount = models.PositiveIntegerField(null=True, blank=True, verbose_name="Importe total")
    payment_type = models.ForeignKey('PaymentsTypes', on_delete=models.CASCADE, blank=True, null=True, verbose_name="Tipo de pago")

    class Meta:
        verbose_name = "envio"
        verbose_name_plural = "envios"

    def __str__(self):
        formatted_date = self.update_date.strftime("%Y-%m-%d %H:%M")
        return f"{self.tracking_number} - {self.status} | Actualizado: {formatted_date}"

