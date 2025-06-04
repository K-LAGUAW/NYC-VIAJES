from django.urls import path
from .views import shipments

urlpatterns = [
    path('shipments/', shipments, name='shipments'),
]