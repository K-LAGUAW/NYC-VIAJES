import requests
import uuid

from .models import Shipments, Parameters, PackagePrices, PackageTypes, PaymentsTypes
from .serializers import (
    ShipmentSerializer, ShipmentSearchSerializer, ShipmentCreateSerializer, 
    PackagePricesSerializer, PackageTypesSerializer, PaymentsTypesSerializer
)

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import ListAPIView

from django.shortcuts import get_object_or_404
from django.http import Http404

class ShipmentsView(ListAPIView):
    queryset = Shipments.objects.filter(status__in=[1, 2, 3]).order_by('-creation_date')
    serializer_class = ShipmentSerializer

class CreateShipmentView(APIView):
    serializer_class = ShipmentCreateSerializer

    def post(self, request, *args, **kwargs):
        serializer = ShipmentCreateSerializer(data=request.data)

        if not serializer.is_valid():
            error_fields = list(serializer.errors.keys())
            
            return Response({
                'message': 'Completa los campos requeridos',
                'errors': error_fields
            }, status=400)

        try:
            validated_data = serializer.validated_data
            total = 0

            if validated_data.get('envelope_amount'):
                total += validated_data['envelope_amount'] * 0.01
            
            if validated_data.get('package_pickup'):
                total += 2500
                
            if validated_data.get('package_amount'):
                total += validated_data['package_amount'].mount

            package_type = validated_data['package_type']
            tracking_number = f"{package_type.abbreviation}-{str(uuid.uuid4())[:8].upper()}"

            shipment = serializer.save(
                tracking_number=tracking_number,
                total_amount=total
            )

            whatsapp_sent = False
            
            try:
                whatsapp_number = validated_data['phone']
                params = {
                    'whatsapp_url': Parameters.objects.get(name="whatsapp_url").value,
                    'message_template': Parameters.objects.get(
                        name="message_tur" if package_type.abbreviation == 'TUR' else "message_paq"
                    ).value
                }
                
                response = requests.post(
                    params['whatsapp_url'],
                    json={
                        "chatId": f"549{whatsapp_number}@c.us",
                        "message": params['message_template'].format(tracking_number=tracking_number)
                    },
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                whatsapp_sent = response.status_code == 200
            except Exception:
                whatsapp_sent = False

            return Response({
                'message': 'Envio creado correctamente' + (', pero no se pudo enviar el mensaje de whatsapp' if not whatsapp_sent else ''),
                'tracking_number': shipment.tracking_number
            }, status=201)

        except Exception:
            return Response({
                'message': 'Error interno al crear el envio'
            }, status=400)

class SearchShipmentView(APIView):
    def get(self, request, tracking_number):
        try:
            shipment = Shipments.objects.get(tracking_number=tracking_number)
            serializer = ShipmentSearchSerializer(shipment)

            return Response({
                    'status': 'success',
                    'message': 'Operacion exitosa',
                    'shipment': serializer.data
                }, status=status.HTTP_200_OK
            )
        except Shipments.DoesNotExist:
            return Response({
                    'status': 'error',
                    'message': f'No se encontro ningun paquete con el numero de seguimiento {tracking_number}'
                }, status=status.HTTP_404_NOT_FOUND
            )

class PackagesCategoriesView(APIView):
    def get(self, request):
        package_types = PackageTypes.objects.all()
        package_prices = PackagePrices.objects.all()
        
        has_types = package_types.exists()
        has_prices = package_prices.exists()
        
        package_types_data = PackageTypesSerializer(package_types, many=True).data if has_types else None
        package_prices_data = PackagePricesSerializer(package_prices, many=True).data if has_prices else None

        return Response({
            'package_types': {
                'message': 'Tipo de paquetes' if has_types else 'Error en la operacion',
                'status': 'success' if has_types else 'error',
                'data': package_types_data if has_types else 'No se encontraron tipos de paquetes'
            },
            'package_prices': {
                'message': 'Precios de paquetes' if has_prices else 'Error en la operacion',
                'status': 'success' if has_prices else 'error',
                'data': package_prices_data if has_prices else 'No se encontraron precios de paquetes'
            }
        }, status=status.HTTP_200_OK)

class PaymentsTypesView(APIView):
    def get(self, request):
        payments_types = PaymentsTypes.objects.all()

        has_payments = payments_types.exists()

        payments_types_data = PaymentsTypesSerializer(payments_types, many=True).data if has_payments else None

        return Response({
                'message': 'Tipos de pagos' if has_payments else 'Error en la operacion',
                'status':'success' if has_payments else 'error',
                'data': payments_types_data if has_payments else 'No se encontraron tipos de pagos'
            }, status=status.HTTP_200_OK
        )

class UpdateShipmentStatusView(APIView):
    def post(self, request, tracking_number):
        try:
            shipment = get_object_or_404(Shipments, tracking_number=tracking_number)
            status_code = 200

            if shipment:
                current_status = shipment.status.id

                if shipment.package_type.abbreviation == 'TUR':
                    if current_status == 3:
                        result = f'Paquete {tracking_number} listo para ser cobrado'
                        status_code = 400
                    else:
                        shipment.status_id = 7
                        shipment.save()
                        result = f'Estado de paquete {tracking_number} actualizado a {shipment.status.name.lower()}'
                else:
                    if current_status == 1:
                        shipment.status_id = 2
                        shipment.save()
                        result = f'Estado de paquete {tracking_number} actualizado a {shipment.status.name.lower()}'
                    elif current_status == 2:
                        shipment.status_id = 3
                        shipment.save()
                        result = f'Estado de paquete {tracking_number} actualizado a {shipment.status.name.lower()}'
                    elif current_status == 3:
                        result = f'Paquete {tracking_number} listo para ser entregado'
                        status_code = 400
            
                return Response({
                    'message': result}, 
                    status=status_code
                )
        except Http404:
            return Response({
                'message': f'No se encontro ningun paquete con el numero de seguimiento {tracking_number}'}, 
                status=404
            )

class CompleteShipmentView(APIView):
    def post(self, request, tracking_number):
        try:
            shipment = Shipments.objects.get(tracking_number=tracking_number)
            current_status = shipment.status.id

            if current_status == 4:
                return Response({
                        'error': 'error',
                        'message': f'El paquete {tracking_number} ya fue entregado'
                    }, status=status.HTTP_400_BAD_REQUEST
                )

            if current_status != 3:
                return Response({
                       'status':'error',
                       'message': f'El paquete {tracking_number} no esta listo para ser entregado'
                    }, status=status.HTTP_400_BAD_REQUEST
                )
            else:
                shipment.status_id = 4
                shipment.save()
                return Response({
                        'status': 'success',
                        'message': f'El paquete {tracking_number} fue entregado correctamente'
                    }, status=status.HTTP_200_OK
                )

        except Shipments.DoesNotExist:
            return Response({
                    'error': 'error',
                    'message': f'No se encontro ningun paquete con el numero de seguimiento {tracking_number}'
                }, status=status.HTTP_404_NOT_FOUND
            )