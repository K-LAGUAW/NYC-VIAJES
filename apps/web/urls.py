from django.urls import path
from .views import shipments, tracking

urlpatterns = [
    path('shipments/', shipments, name='shipments'),
    path('tracking/', tracking, name='consultation')
]