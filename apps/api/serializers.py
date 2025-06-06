from rest_framework import serializers
from . models import Shipments, PackagePrices, PackageTypes, PaymentsTypes

class ShipmentSerializer(serializers.ModelSerializer):
    creation_date = serializers.DateTimeField(format="%d-%m-%Y %H:%M")
    update_date = serializers.DateTimeField(format="%d-%m-%Y %H:%M")
    status = serializers.SerializerMethodField()

    class Meta:
        model = Shipments
        fields = '__all__'

    def get_status(self, obj):
        return {
            'id': obj.status.id,
            'name': obj.status.name,
            'abbreviation': obj.status.abbreviation
        }

class ShipmentCreateSerializer(serializers.ModelSerializer):
    creation_date = serializers.DateTimeField(format="%d-%m-%Y %H:%M", read_only=True)
    update_date = serializers.DateTimeField(format="%d-%m-%Y %H:%M", read_only=True)
    
    class Meta:
        model = Shipments
        fields = '__all__'
        read_only_fields = ('tracking_number', 'status', 'total_amount', 'payment_type')

class ShipmentSearchSerializer(serializers.ModelSerializer):
    creation_date = serializers.DateTimeField(format="%d-%m-%Y %H:%M")
    update_date = serializers.DateTimeField(format="%d-%m-%Y %H:%M")
    status = serializers.SerializerMethodField()

    class Meta:
        model = Shipments
        fields = ('tracking_number', 'status', 'sender', 'recipient', 'creation_date', 'update_date')

    def get_status(self, obj):
        return {
            'id': obj.status.id,
            'name': obj.status.name,
            'abbreviation': obj.status.abbreviation
        }

class PackagePricesSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackagePrices
        fields = ('name', 'mount', 'abbreviation')

class PackageTypesSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageTypes
        fields = ('name', 'abbreviation')

class PaymentsTypesSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentsTypes
        fields = ('name', 'abbreviation')