from django.urls import path
from .views import ShipmentsView, CreateShipmentView, SearchShipmentView, PackagesCategoriesView, CompleteShipmentView
from .views import UpdateShipmentStatusView

urlpatterns = [
    path('shipments/', ShipmentsView.as_view(), name='shipments'),
    path('packages_categories/', PackagesCategoriesView.as_view(), name='packages_categories'),
    path('create_shipment/', CreateShipmentView.as_view(), name='create_shipment'),
    path('search_shipment/<str:tracking_number>/', SearchShipmentView.as_view(), name='search_shipment'),
    path('update_shipment/<str:tracking_number>/', UpdateShipmentStatusView.as_view(), name='update_status'),
    path('complete_shipment/<str:tracking_number>/', CompleteShipmentView.as_view(), name='complete_shipment'),
]